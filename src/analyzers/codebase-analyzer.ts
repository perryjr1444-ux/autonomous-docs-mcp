import { glob } from "glob";
import * as fs from "fs-extra";
import * as path from "path";

export interface AnalysisOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
  depth: "quick" | "standard" | "comprehensive";
}

export interface CodebaseAnalysis {
  structure: ProjectStructure;
  apis: APIDefinition[];
  components: Component[];
  documentation_needs: DocumentationNeed[];
  suggested_navigation: NavigationStructure;
  metadata: ProjectMetadata;
}

export interface ProjectStructure {
  root: string;
  directories: DirectoryNode[];
  files: FileNode[];
  languages: string[];
  frameworks: string[];
}

export interface DirectoryNode {
  path: string;
  name: string;
  children: (DirectoryNode | FileNode)[];
  purpose?: string;
}

export interface FileNode {
  path: string;
  name: string;
  type: string;
  language?: string;
  exports?: string[];
  imports?: string[];
  docstrings?: string[];
}

export interface APIDefinition {
  name: string;
  type: "function" | "class" | "endpoint" | "component";
  file: string;
  line: number;
  signature: string;
  description?: string;
  parameters?: Parameter[];
  returns?: string;
  examples?: string[];
}

export interface Parameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: string;
}

export interface Component {
  name: string;
  type: string;
  file: string;
  props?: Parameter[];
  description?: string;
}

export interface DocumentationNeed {
  type: "missing" | "outdated" | "incomplete";
  file: string;
  item: string;
  priority: "high" | "medium" | "low";
  suggestion: string;
}

export interface NavigationStructure {
  groups: NavigationGroup[];
}

export interface NavigationGroup {
  group: string;
  pages: (string | NavigationGroup)[];
}

export interface ProjectMetadata {
  name: string;
  version?: string;
  description?: string;
  repository?: string;
  author?: string;
}

export class CodebaseAnalyzer {
  async analyze(
    rootPath: string,
    options: AnalysisOptions
  ): Promise<CodebaseAnalysis> {
    console.error(`Analyzing codebase at ${rootPath}...`);

    const defaultExcludes = [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/venv/**",
      "**/__pycache__/**",
      "**/*.min.js",
      "**/.next/**",
    ];

    const excludePatterns = [
      ...defaultExcludes,
      ...(options.excludePatterns || []),
    ];

    // Discover files
    const files = await this.discoverFiles(
      rootPath,
      options.includePatterns,
      excludePatterns
    );

    // Build structure
    const structure = await this.buildStructure(rootPath, files);

    // Extract APIs based on depth
    const apis = await this.extractAPIs(files, options.depth);

    // Extract components
    const components = await this.extractComponents(files);

    // Analyze documentation needs
    const documentationNeeds = await this.analyzeDocumentationNeeds(
      files,
      apis,
      components
    );

    // Generate navigation suggestion
    const suggestedNavigation = this.generateNavigation(structure);

    // Extract metadata
    const metadata = await this.extractMetadata(rootPath);

    return {
      structure,
      apis,
      components,
      documentation_needs: documentationNeeds,
      suggested_navigation: suggestedNavigation,
      metadata,
    };
  }

  private async discoverFiles(
    rootPath: string,
    includePatterns?: string[],
    excludePatterns?: string[]
  ): Promise<string[]> {
    const defaultPatterns = [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx",
      "**/*.py",
      "**/*.go",
      "**/*.rs",
      "**/*.java",
      "**/*.md",
      "**/*.mdx",
    ];

    const patterns = includePatterns || defaultPatterns;
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const matched = await glob(pattern, {
        cwd: rootPath,
        ignore: excludePatterns,
        absolute: false,
      });
      allFiles.push(...matched);
    }

    return [...new Set(allFiles)];
  }

  private async buildStructure(
    rootPath: string,
    files: string[]
  ): Promise<ProjectStructure> {
    const directories = new Set<string>();
    const languages = new Set<string>();
    const frameworks = new Set<string>();

    const fileNodes: FileNode[] = [];

    for (const file of files) {
      const dir = path.dirname(file);
      directories.add(dir);

      const ext = path.extname(file);
      const language = this.detectLanguage(ext);
      if (language) languages.add(language);

      fileNodes.push({
        path: file,
        name: path.basename(file),
        type: ext,
        language,
      });
    }

    // Detect frameworks
    const packageJsonPath = path.join(rootPath, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.react) frameworks.add("React");
      if (deps.next) frameworks.add("Next.js");
      if (deps.vue) frameworks.add("Vue");
      if (deps.express) frameworks.add("Express");
      if (deps.fastapi) frameworks.add("FastAPI");
    }

    return {
      root: rootPath,
      directories: [],
      files: fileNodes,
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
    };
  }

  private detectLanguage(ext: string): string | undefined {
    const langMap: Record<string, string> = {
      ".ts": "TypeScript",
      ".tsx": "TypeScript",
      ".js": "JavaScript",
      ".jsx": "JavaScript",
      ".py": "Python",
      ".go": "Go",
      ".rs": "Rust",
      ".java": "Java",
    };
    return langMap[ext];
  }

  private async extractAPIs(
    files: string[],
    depth: string
  ): Promise<APIDefinition[]> {
    // Simplified API extraction - would use proper parsers in production
    const apis: APIDefinition[] = [];

    // Quick scan for common patterns
    const apiFiles = files.filter(
      (f) =>
        f.includes("api") ||
        f.includes("route") ||
        f.includes("endpoint") ||
        f.endsWith(".ts") ||
        f.endsWith(".py")
    );

    for (const file of apiFiles.slice(0, depth === "quick" ? 10 : 100)) {
      // Placeholder - would parse actual code
      apis.push({
        name: path.basename(file, path.extname(file)),
        type: "endpoint",
        file,
        line: 1,
        signature: "function()",
        description: `API from ${file}`,
      });
    }

    return apis;
  }

  private async extractComponents(files: string[]): Promise<Component[]> {
    const components: Component[] = [];

    const componentFiles = files.filter(
      (f) =>
        f.endsWith(".tsx") ||
        f.endsWith(".jsx") ||
        f.includes("component")
    );

    for (const file of componentFiles) {
      components.push({
        name: path.basename(file, path.extname(file)),
        type: "react",
        file,
      });
    }

    return components;
  }

  private async analyzeDocumentationNeeds(
    files: string[],
    apis: APIDefinition[],
    components: Component[]
  ): Promise<DocumentationNeed[]> {
    const needs: DocumentationNeed[] = [];

    // Check for missing README
    const hasReadme = files.some((f) => f.toLowerCase().includes("readme"));
    if (!hasReadme) {
      needs.push({
        type: "missing",
        file: "README.md",
        item: "Project README",
        priority: "high",
        suggestion: "Create comprehensive project overview",
      });
    }

    // APIs without docs
    for (const api of apis) {
      if (!api.description) {
        needs.push({
          type: "missing",
          file: api.file,
          item: api.name,
          priority: "medium",
          suggestion: `Add API documentation for ${api.name}`,
        });
      }
    }

    return needs;
  }

  private generateNavigation(structure: ProjectStructure): NavigationStructure {
    const groups: NavigationGroup[] = [];

    // Getting Started
    groups.push({
      group: "Getting Started",
      pages: ["introduction", "quickstart", "installation"],
    });

    // API Reference (if APIs detected)
    groups.push({
      group: "API Reference",
      pages: ["api/overview", "api/authentication", "api/endpoints"],
    });

    // Guides (based on frameworks)
    if (structure.frameworks.length > 0) {
      groups.push({
        group: "Guides",
        pages: ["guides/overview", "guides/examples", "guides/best-practices"],
      });
    }

    return { groups };
  }

  private async extractMetadata(rootPath: string): Promise<ProjectMetadata> {
    const metadata: ProjectMetadata = {
      name: path.basename(rootPath),
    };

    // Check package.json
    const packageJsonPath = path.join(rootPath, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      metadata.name = pkg.name || metadata.name;
      metadata.version = pkg.version;
      metadata.description = pkg.description;
      metadata.repository = pkg.repository?.url || pkg.repository;
      metadata.author = pkg.author;
    }

    // Check pyproject.toml or setup.py for Python projects
    const pyprojectPath = path.join(rootPath, "pyproject.toml");
    if (await fs.pathExists(pyprojectPath)) {
      // Would parse TOML in production
      metadata.name = path.basename(rootPath);
    }

    return metadata;
  }

  async syncWithSource(
    docsPath: string,
    sourcePath: string,
    options: { autoUpdate: boolean }
  ): Promise<any> {
    console.error("Syncing documentation with source code...");

    // Analyze current docs
    // Compare with source
    // Detect changes
    // Generate update suggestions or auto-update

    return {
      status: "synced",
      outdated: [],
      updated: [],
      suggestions: [],
    };
  }

  async extractExamples(
    sourcePath: string,
    options: { outputPath?: string; categories?: string[] }
  ): Promise<any> {
    console.error("Extracting code examples...");

    // Find test files
    // Find example directories
    // Extract code snippets
    // Categorize examples

    return {
      examples: [],
      categories: [],
    };
  }
}
