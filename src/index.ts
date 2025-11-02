#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { CodebaseAnalyzer } from "./analyzers/codebase-analyzer.js";
import { MDXGenerator } from "./generators/mdx-generator.js";
import { DocsConfigGenerator } from "./generators/docs-config-generator.js";
import { DocumentationValidator } from "./validators/doc-validator.js";

const server = new Server(
  {
    name: "autonomous-docs-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const analyzer = new CodebaseAnalyzer();
const mdxGenerator = new MDXGenerator();
const configGenerator = new DocsConfigGenerator();
const validator = new DocumentationValidator();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_codebase",
      description: "Autonomously analyze entire codebase structure, extract documentation needs, identify APIs, components, and generate documentation plan",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Root path to analyze (defaults to current directory)",
          },
          include_patterns: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns to include (e.g., ['**/*.ts', '**/*.py'])",
          },
          exclude_patterns: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns to exclude (e.g., ['node_modules/**', 'dist/**'])",
          },
          depth: {
            type: "string",
            enum: ["quick", "standard", "comprehensive"],
            description: "Analysis depth level",
            default: "standard",
          },
        },
        required: [],
      },
    },
    {
      name: "generate_documentation",
      description: "Generate complete Mintlify-style documentation with MDX files, frontmatter, navigation, and configuration",
      inputSchema: {
        type: "object",
        properties: {
          analysis_result: {
            type: "string",
            description: "JSON string from analyze_codebase or path to analysis file",
          },
          output_dir: {
            type: "string",
            description: "Output directory for generated documentation",
            default: "./docs",
          },
          theme: {
            type: "string",
            enum: ["default", "minimal", "technical", "modern"],
            description: "Documentation theme/style",
            default: "default",
          },
          include_api_reference: {
            type: "boolean",
            description: "Auto-generate API reference pages",
            default: true,
          },
          include_examples: {
            type: "boolean",
            description: "Generate code examples",
            default: true,
          },
        },
        required: ["analysis_result"],
      },
    },
    {
      name: "generate_api_reference",
      description: "Generate API reference documentation from code annotations, JSDoc, docstrings, and type definitions",
      inputSchema: {
        type: "object",
        properties: {
          source_path: {
            type: "string",
            description: "Path to source code for API extraction",
          },
          output_path: {
            type: "string",
            description: "Output path for API reference",
          },
          format: {
            type: "string",
            enum: ["mintlify", "openapi", "markdown"],
            description: "Output format",
            default: "mintlify",
          },
          include_private: {
            type: "boolean",
            description: "Include private/internal APIs",
            default: false,
          },
        },
        required: ["source_path"],
      },
    },
    {
      name: "create_docs_config",
      description: "Generate docs.json configuration with navigation, theme settings, and integrations",
      inputSchema: {
        type: "object",
        properties: {
          project_name: {
            type: "string",
            description: "Project name for documentation",
          },
          structure: {
            type: "string",
            description: "JSON string of documentation structure",
          },
          theme_config: {
            type: "object",
            description: "Theme customization options",
          },
          integrations: {
            type: "array",
            items: { type: "string" },
            description: "Integrations to enable (e.g., ['github', 'slack'])",
          },
        },
        required: ["project_name", "structure"],
      },
    },
    {
      name: "validate_documentation",
      description: "Validate MDX files, frontmatter, internal links, code examples, and overall documentation quality",
      inputSchema: {
        type: "object",
        properties: {
          docs_path: {
            type: "string",
            description: "Path to documentation directory",
          },
          strict: {
            type: "boolean",
            description: "Enable strict validation mode",
            default: false,
          },
          check_links: {
            type: "boolean",
            description: "Validate all internal links",
            default: true,
          },
          check_code_examples: {
            type: "boolean",
            description: "Validate code examples syntax",
            default: true,
          },
        },
        required: ["docs_path"],
      },
    },
    {
      name: "sync_documentation",
      description: "Sync documentation with codebase changes, detect outdated content, and suggest updates",
      inputSchema: {
        type: "object",
        properties: {
          docs_path: {
            type: "string",
            description: "Path to documentation directory",
          },
          source_path: {
            type: "string",
            description: "Path to source code",
          },
          auto_update: {
            type: "boolean",
            description: "Automatically update outdated documentation",
            default: false,
          },
        },
        required: ["docs_path", "source_path"],
      },
    },
    {
      name: "generate_changelog",
      description: "Generate changelog from git history with semantic versioning and categorization",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: {
            type: "string",
            description: "Path to git repository",
          },
          from_version: {
            type: "string",
            description: "Starting version/tag",
          },
          to_version: {
            type: "string",
            description: "Ending version/tag (defaults to HEAD)",
          },
          format: {
            type: "string",
            enum: ["mintlify", "keep-a-changelog", "conventional"],
            description: "Changelog format",
            default: "mintlify",
          },
        },
        required: ["repo_path"],
      },
    },
    {
      name: "extract_code_examples",
      description: "Extract and organize code examples from tests, demos, and source files",
      inputSchema: {
        type: "object",
        properties: {
          source_path: {
            type: "string",
            description: "Path to source code",
          },
          output_path: {
            type: "string",
            description: "Output path for examples",
          },
          categories: {
            type: "array",
            items: { type: "string" },
            description: "Example categories to extract",
          },
        },
        required: ["source_path"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
    }

    switch (name) {
      case "analyze_codebase": {
        const result = await analyzer.analyze(
          (args.path as string) || process.cwd(),
          {
            includePatterns: args.include_patterns as string[] | undefined,
            excludePatterns: args.exclude_patterns as string[] | undefined,
            depth: (args.depth as "quick" | "standard" | "comprehensive") || "standard",
          }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_documentation": {
        const analysis = typeof args.analysis_result === "string"
          ? JSON.parse(args.analysis_result)
          : args.analysis_result;

        const result = await mdxGenerator.generate(analysis, {
          outputDir: (args.output_dir as string) || "./docs",
          theme: (args.theme as "default" | "minimal" | "technical" | "modern") || "default",
          includeApiReference: args.include_api_reference !== false,
          includeExamples: args.include_examples !== false,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_api_reference": {
        const result = await mdxGenerator.generateApiReference(
          args.source_path as string,
          {
            outputPath: args.output_path as string | undefined,
            format: (args.format as string) || "mintlify",
            includePrivate: (args.include_private as boolean) || false,
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_docs_config": {
        const structure = typeof args.structure === "string"
          ? JSON.parse(args.structure)
          : args.structure;

        const config = await configGenerator.generate({
          projectName: args.project_name as string,
          structure,
          themeConfig: args.theme_config as any,
          integrations: args.integrations as string[] | undefined,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case "validate_documentation": {
        const result = await validator.validate(args.docs_path as string, {
          strict: (args.strict as boolean) || false,
          checkLinks: args.check_links !== false,
          checkCodeExamples: args.check_code_examples !== false,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "sync_documentation": {
        const result = await analyzer.syncWithSource(
          args.docs_path as string,
          args.source_path as string,
          {
            autoUpdate: (args.auto_update as boolean) || false,
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_changelog": {
        const result = await mdxGenerator.generateChangelog(
          args.repo_path as string,
          {
            fromVersion: args.from_version as string | undefined,
            toVersion: args.to_version as string | undefined,
            format: (args.format as string) || "mintlify",
          }
        );

        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "extract_code_examples": {
        const result = await analyzer.extractExamples(
          args.source_path as string,
          {
            outputPath: args.output_path as string | undefined,
            categories: args.categories as string[] | undefined,
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Autonomous Docs MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
