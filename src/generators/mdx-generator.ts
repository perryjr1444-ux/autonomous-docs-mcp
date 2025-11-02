import * as fs from "fs-extra";
import * as path from "path";
import matter from "gray-matter";
import type { CodebaseAnalysis } from "../analyzers/codebase-analyzer.js";

export interface GenerationOptions {
  outputDir: string;
  theme: "default" | "minimal" | "technical" | "modern";
  includeApiReference: boolean;
  includeExamples: boolean;
}

export interface GenerationResult {
  files_created: string[];
  config_path: string;
  summary: string;
}

export class MDXGenerator {
  async generate(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    console.error(`Generating documentation in ${options.outputDir}...`);

    await fs.ensureDir(options.outputDir);

    const filesCreated: string[] = [];

    // Generate introduction
    filesCreated.push(await this.generateIntroduction(analysis, options));

    // Generate quickstart
    filesCreated.push(await this.generateQuickstart(analysis, options));

    // Generate API reference
    if (options.includeApiReference && analysis.apis.length > 0) {
      const apiFiles = await this.generateAPIPages(analysis, options);
      filesCreated.push(...apiFiles);
    }

    // Generate component docs
    if (analysis.components.length > 0) {
      const componentFiles = await this.generateComponentPages(
        analysis,
        options
      );
      filesCreated.push(...componentFiles);
    }

    // Generate guides
    filesCreated.push(await this.generateGuidesOverview(analysis, options));

    return {
      files_created: filesCreated,
      config_path: path.join(options.outputDir, "docs.json"),
      summary: `Generated ${filesCreated.length} documentation files`,
    };
  }

  private async generateIntroduction(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<string> {
    const filePath = path.join(options.outputDir, "introduction.mdx");

    const content = matter.stringify(
      `# Welcome to ${analysis.metadata.name}

${analysis.metadata.description || ""}

## Overview

This documentation provides comprehensive information about ${analysis.metadata.name}.

### Key Features

- Built with ${analysis.structure.languages.join(", ")}
- ${analysis.structure.frameworks.length > 0 ? `Uses ${analysis.structure.frameworks.join(", ")}` : ""}
- ${analysis.apis.length} API endpoints
- ${analysis.components.length} components

### Quick Links

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/quickstart">
    Get started in minutes
  </Card>
  <Card title="API Reference" icon="code" href="/api/overview">
    Explore the API
  </Card>
  <Card title="Guides" icon="book" href="/guides/overview">
    Learn best practices
  </Card>
  <Card title="Examples" icon="lightbulb" href="/examples">
    See it in action
  </Card>
</CardGroup>

## Architecture

${this.generateArchitectureSection(analysis)}

## Getting Help

- GitHub: ${analysis.metadata.repository || "N/A"}
- Issues: Report bugs and request features

`,
      {
        title: `${analysis.metadata.name} Documentation`,
        description: analysis.metadata.description || `Documentation for ${analysis.metadata.name}`,
      }
    );

    await fs.writeFile(filePath, content);
    console.error(`Created: ${filePath}`);
    return filePath;
  }

  private generateArchitectureSection(analysis: CodebaseAnalysis): string {
    let arch = "The project is organized as follows:\n\n";

    if (analysis.structure.frameworks.length > 0) {
      arch += `### Framework\n\n`;
      arch += `This project uses ${analysis.structure.frameworks.join(", ")}.\n\n`;
    }

    arch += `### Project Structure\n\n`;
    arch += "```\n";
    // Simplified structure visualization
    const mainDirs = new Set(
      analysis.structure.files.map((f) => f.path.split("/")[0])
    );
    mainDirs.forEach((dir) => {
      arch += `${dir}/\n`;
    });
    arch += "```\n\n";

    return arch;
  }

  private async generateQuickstart(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<string> {
    const filePath = path.join(options.outputDir, "quickstart.mdx");

    const hasNodeProject = analysis.structure.files.some((f) =>
      f.name === "package.json"
    );
    const hasPythonProject = analysis.structure.files.some(
      (f) => f.name === "requirements.txt" || f.name === "pyproject.toml"
    );

    let installationSteps = "";

    if (hasNodeProject) {
      installationSteps += `## Installation

\`\`\`bash
# Clone the repository
git clone ${analysis.metadata.repository || "<repository-url>"}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

`;
    } else if (hasPythonProject) {
      installationSteps += `## Installation

\`\`\`bash
# Clone the repository
git clone ${analysis.metadata.repository || "<repository-url>"}

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
\`\`\`

`;
    }

    const content = matter.stringify(
      `# Quickstart

Get up and running with ${analysis.metadata.name} in under 5 minutes.

## Prerequisites

${hasNodeProject ? "- Node.js 18+ installed" : ""}
${hasPythonProject ? "- Python 3.9+ installed" : ""}
- Git installed

${installationSteps}

## First Steps

### Basic Usage

\`\`\`${analysis.structure.languages[0]?.toLowerCase() || "bash"}
// Your first example here
\`\`\`

### Next Steps

<CardGroup cols={2}>
  <Card title="API Reference" icon="code" href="/api/overview">
    Explore available APIs
  </Card>
  <Card title="Examples" icon="lightbulb" href="/examples">
    See practical examples
  </Card>
</CardGroup>

## Common Issues

<AccordionGroup>
  <Accordion title="Installation fails">
    Ensure you have the correct version of dependencies installed.
  </Accordion>

  <Accordion title="Server won't start">
    Check that the required ports are available.
  </Accordion>
</AccordionGroup>

`,
      {
        title: "Quickstart Guide",
        description: `Get started with ${analysis.metadata.name} quickly`,
      }
    );

    await fs.writeFile(filePath, content);
    console.error(`Created: ${filePath}`);
    return filePath;
  }

  private async generateAPIPages(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<string[]> {
    const apiDir = path.join(options.outputDir, "api");
    await fs.ensureDir(apiDir);

    const files: string[] = [];

    // Overview page
    const overviewPath = path.join(apiDir, "overview.mdx");
    const overviewContent = matter.stringify(
      `# API Reference

Comprehensive API documentation for ${analysis.metadata.name}.

## Available APIs

${analysis.apis.map((api) => `- [\`${api.name}\`](/api/${api.name.toLowerCase()}) - ${api.description || ""}`).join("\n")}

## Authentication

Details about authentication will be documented here.

## Rate Limiting

Information about rate limits will be documented here.

`,
      {
        title: "API Reference",
        description: "Complete API documentation",
      }
    );

    await fs.writeFile(overviewPath, overviewContent);
    files.push(overviewPath);

    // Individual API pages (first 10 for quick generation)
    for (const api of analysis.apis.slice(0, 10)) {
      const apiPath = path.join(apiDir, `${api.name.toLowerCase()}.mdx`);
      const apiContent = matter.stringify(
        `# ${api.name}

${api.description || ""}

## Signature

\`\`\`typescript
${api.signature}
\`\`\`

${api.parameters && api.parameters.length > 0 ? `
## Parameters

${api.parameters.map((p) => `- \`${p.name}\` (${p.type})${p.required ? " **required**" : ""} - ${p.description || ""}`).join("\n")}
` : ""}

${api.returns ? `
## Returns

\`${api.returns}\`
` : ""}

## Example

\`\`\`typescript
// Example usage
const result = await ${api.name}();
\`\`\`

`,
        {
          title: api.name,
          description: api.description || `API documentation for ${api.name}`,
        }
      );

      await fs.writeFile(apiPath, apiContent);
      files.push(apiPath);
    }

    return files;
  }

  private async generateComponentPages(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<string[]> {
    const componentsDir = path.join(options.outputDir, "components");
    await fs.ensureDir(componentsDir);

    const files: string[] = [];

    for (const component of analysis.components.slice(0, 10)) {
      const compPath = path.join(
        componentsDir,
        `${component.name.toLowerCase()}.mdx`
      );
      const compContent = matter.stringify(
        `# ${component.name}

${component.description || ""}

## Props

${component.props && component.props.length > 0 ? component.props.map((p) => `- \`${p.name}\` (${p.type})${p.required ? " **required**" : ""} - ${p.description || ""}`).join("\n") : "No props"}

## Example

\`\`\`tsx
<${component.name} />
\`\`\`

`,
        {
          title: component.name,
          description: component.description || `${component.name} component`,
        }
      );

      await fs.writeFile(compPath, compContent);
      files.push(compPath);
    }

    return files;
  }

  private async generateGuidesOverview(
    analysis: CodebaseAnalysis,
    options: GenerationOptions
  ): Promise<string> {
    const guidesDir = path.join(options.outputDir, "guides");
    await fs.ensureDir(guidesDir);

    const filePath = path.join(guidesDir, "overview.mdx");

    const content = matter.stringify(
      `# Guides

Learn how to make the most of ${analysis.metadata.name}.

## Getting Started

<CardGroup cols={2}>
  <Card title="Best Practices" icon="star" href="/guides/best-practices">
    Learn recommended patterns
  </Card>
  <Card title="Common Patterns" icon="puzzle-piece" href="/guides/patterns">
    Reusable solutions
  </Card>
</CardGroup>

## Advanced Topics

- Performance optimization
- Security considerations
- Deployment strategies

`,
      {
        title: "Guides",
        description: "Guides and best practices",
      }
    );

    await fs.writeFile(filePath, content);
    console.error(`Created: ${filePath}`);
    return filePath;
  }

  async generateApiReference(
    sourcePath: string,
    options: {
      outputPath?: string;
      format: string;
      includePrivate: boolean;
    }
  ): Promise<any> {
    console.error("Generating API reference...");

    // Parse source code
    // Extract API definitions
    // Generate formatted output

    return {
      files_generated: [],
      format: options.format,
    };
  }

  async generateChangelog(
    repoPath: string,
    options: {
      fromVersion?: string;
      toVersion?: string;
      format: string;
    }
  ): Promise<string> {
    console.error("Generating changelog...");

    // Parse git history
    // Categorize commits
    // Format as specified

    return `# Changelog

## [Unreleased]

### Added
- New features

### Fixed
- Bug fixes

`;
  }
}
