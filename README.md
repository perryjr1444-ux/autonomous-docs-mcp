# Autonomous Documentation MCP

[![npm version](https://img.shields.io/npm/v/autonomous-docs-mcp.svg)](https://www.npmjs.com/package/autonomous-docs-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Autonomous documentation generation tool powered by Model Context Protocol (MCP) with Mintlify-style presentation for codebases. Automatically analyze, generate, and maintain beautiful documentation that stays in sync with your code.

## Overview

Autonomous Documentation MCP is an intelligent documentation system that understands your codebase and generates professional-grade documentation automatically. Built on the Model Context Protocol, it provides AI agents with powerful tools to analyze code structure, extract APIs, and create comprehensive documentation with zero manual configuration.

### Why Autonomous Docs MCP?

- **Zero Configuration**: Works out of the box with intelligent defaults
- **AI-Native**: Built specifically for AI agent consumption via MCP
- **Mintlify-Style**: Generates beautiful, modern documentation
- **Multi-Language**: Supports TypeScript, JavaScript, Python, Go, Rust, Java, and more
- **Continuous Sync**: Keeps docs updated as code evolves
- **Quality Validation**: Built-in checks for links, examples, and completeness

## Features

### Core Capabilities

- **Autonomous Codebase Analysis**: Automatically scan and understand your entire codebase structure
- **Mintlify-Style Generation**: Generate beautiful, modern documentation with MDX and Mintlify components
- **API Reference Auto-Generation**: Extract API definitions from code annotations, JSDoc, and docstrings
- **Smart Navigation**: Automatically organize docs with intelligent navigation structure
- **Documentation Validation**: Ensure quality with built-in validation for links, examples, and frontmatter
- **Sync with Source**: Keep docs updated as code changes with automatic change detection
- **Multi-Language Support**: First-class support for TypeScript, JavaScript, Python, Go, Rust, Java
- **Changelog Generation**: Automatically generate changelogs from git history with semantic versioning
- **Code Example Extraction**: Extract and organize code examples from tests, demos, and source files

### MCP Tools

The server exposes 8 powerful tools via Model Context Protocol:

1. **analyze_codebase** - Autonomously analyze entire codebase structure
2. **generate_documentation** - Generate complete Mintlify-style documentation
3. **generate_api_reference** - Generate API reference from code annotations
4. **create_docs_config** - Generate docs.json configuration
5. **validate_documentation** - Validate MDX files, links, and code examples
6. **sync_documentation** - Sync docs with codebase changes
7. **generate_changelog** - Generate changelog from git history
8. **extract_code_examples** - Extract code examples from source

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git (for changelog generation)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/perryjr1444/autonomous-docs-mcp.git
cd autonomous-docs-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Configuration

### MCP Server Configuration

Add to your `.claude.json` or MCP client configuration:

```json
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["/path/to/autonomous-docs-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### Project Configuration (Optional)

Create a `.autodocs.json` in your project root for custom settings:

```json
{
  "includePatterns": ["**/*.ts", "**/*.js", "**/*.py"],
  "excludePatterns": ["node_modules/**", "dist/**", "*.test.*"],
  "theme": "modern",
  "outputDir": "./docs",
  "apiReference": {
    "format": "mintlify",
    "includePrivate": false
  },
  "validation": {
    "strict": true,
    "checkLinks": true,
    "checkCodeExamples": true
  }
}
```

## Usage

### Quick Start

```typescript
// 1. Analyze your codebase
const analysis = await analyze_codebase({
  path: "/Users/you/my-project",
  depth: "comprehensive",
  include_patterns: ["**/*.ts", "**/*.py"],
  exclude_patterns: ["node_modules/**", "dist/**"]
});

// 2. Generate documentation
const docs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  output_dir: "./docs",
  theme: "modern",
  include_api_reference: true,
  include_examples: true
});

// 3. Validate generated docs
const validation = await validate_documentation({
  docs_path: "./docs",
  strict: false,
  check_links: true,
  check_code_examples: true
});
```

### API Reference

#### analyze_codebase

Analyze entire codebase structure and identify documentation needs.

```typescript
analyze_codebase({
  path: string,                    // Root path (defaults to current directory)
  include_patterns?: string[],     // Glob patterns to include
  exclude_patterns?: string[],     // Glob patterns to exclude
  depth?: "quick" | "standard" | "comprehensive"  // Analysis depth
})
```

**Returns**: JSON analysis result with:
- Project structure
- Identified components and APIs
- Documentation recommendations
- File classifications

#### generate_documentation

Generate complete Mintlify-style documentation with MDX files, frontmatter, and navigation.

```typescript
generate_documentation({
  analysis_result: string,         // JSON from analyze_codebase
  output_dir?: string,             // Output directory (default: "./docs")
  theme?: "default" | "minimal" | "technical" | "modern",
  include_api_reference?: boolean, // Auto-generate API reference
  include_examples?: boolean       // Generate code examples
})
```

**Returns**: Generation report with:
- Files created
- Navigation structure
- Theme configuration
- Validation summary

#### generate_api_reference

Generate API reference documentation from code annotations.

```typescript
generate_api_reference({
  source_path: string,             // Path to source code
  output_path?: string,            // Output path for API reference
  format?: "mintlify" | "openapi" | "markdown",
  include_private?: boolean        // Include private/internal APIs
})
```

#### create_docs_config

Generate docs.json configuration with navigation and theme settings.

```typescript
create_docs_config({
  project_name: string,            // Project name
  structure: string,               // JSON string of doc structure
  theme_config?: object,           // Theme customization
  integrations?: string[]          // Integrations (e.g., ['github', 'slack'])
})
```

#### validate_documentation

Validate MDX files, frontmatter, internal links, and code examples.

```typescript
validate_documentation({
  docs_path: string,               // Path to documentation directory
  strict?: boolean,                // Enable strict validation mode
  check_links?: boolean,           // Validate all internal links
  check_code_examples?: boolean    // Validate code examples syntax
})
```

**Returns**: Validation report with:
- Errors and warnings
- Broken links
- Invalid code examples
- Missing frontmatter

#### sync_documentation

Sync documentation with codebase changes and detect outdated content.

```typescript
sync_documentation({
  docs_path: string,               // Path to documentation directory
  source_path: string,             // Path to source code
  auto_update?: boolean            // Automatically update outdated docs
})
```

**Returns**: Sync report with:
- Outdated files
- New APIs detected
- Removed components
- Update suggestions

#### generate_changelog

Generate changelog from git history with semantic versioning.

```typescript
generate_changelog({
  repo_path: string,               // Path to git repository
  from_version?: string,           // Starting version/tag
  to_version?: string,             // Ending version/tag (defaults to HEAD)
  format?: "mintlify" | "keep-a-changelog" | "conventional"
})
```

#### extract_code_examples

Extract and organize code examples from tests, demos, and source files.

```typescript
extract_code_examples({
  source_path: string,             // Path to source code
  output_path?: string,            // Output path for examples
  categories?: string[]            // Example categories to extract
})
```

## Documentation Structure

Generated documentation follows Mintlify best practices:

```
docs/
├── introduction.mdx              # Project overview
├── quickstart.mdx                # Getting started guide
├── installation.mdx              # Installation instructions
├── api/
│   ├── overview.mdx             # API reference overview
│   ├── authentication.mdx       # Authentication guide
│   └── endpoints/               # Individual endpoint docs
│       ├── users.mdx
│       └── projects.mdx
├── guides/
│   ├── overview.mdx             # Guides overview
│   ├── best-practices.mdx       # Best practices
│   └── troubleshooting.mdx      # Common issues
├── components/                   # Component documentation
│   ├── button.mdx
│   └── modal.mdx
├── examples/                     # Code examples
│   ├── basic-usage.mdx
│   └── advanced-usage.mdx
├── changelog.mdx                 # Changelog
└── docs.json                     # Navigation configuration
```

## Frontmatter Requirements

All generated MDX files include proper frontmatter for Mintlify:

```yaml
---
title: "Page Title"
description: "Page description for SEO and navigation"
icon: "file-lines"
---
```

## Mintlify Components

Generated docs support and utilize Mintlify's component library:

```mdx
<Card title="Feature Name" icon="star">
  Feature description
</Card>

<CardGroup cols={2}>
  <Card title="Card 1" icon="rocket">Content</Card>
  <Card title="Card 2" icon="shield">Content</Card>
</CardGroup>

<Accordion title="Click to expand">
  Collapsible content
</Accordion>

<CodeGroup>
```typescript
// TypeScript example
const example = "code";
```

```python
# Python example
example = "code"
```
</CodeGroup>

<Tabs>
  <Tab title="TypeScript">TypeScript content</Tab>
  <Tab title="Python">Python content</Tab>
</Tabs>
```

## Examples

Check out the [examples/](examples/) directory for:

- **API Plugin Integration** - Integrate with API documentation tools
- **Continuous Sync** - Keep docs in sync with CI/CD
- **Custom Themes** - Create custom documentation themes
- **GitHub Actions** - Automate doc generation on push
- **Mintlify Deploy** - Deploy to Mintlify hosting
- **Multi-Repo** - Aggregate docs from multiple repositories
- **Pre-commit Hooks** - Validate docs before commits

See [examples/INTEGRATION_EXAMPLES.md](examples/INTEGRATION_EXAMPLES.md) for detailed integration guides.

## Best Practices

1. **Run Analysis Regularly**: Keep docs in sync with code changes
   ```bash
   # Add to CI/CD pipeline
   npm run analyze && npm run generate
   ```

2. **Validate Before Deploying**: Use validation tool to catch issues
   ```bash
   npm run validate-docs
   ```

3. **Customize Themes**: Match your brand with theme configuration
   ```json
   {
     "theme": "modern",
     "theme_config": {
       "primaryColor": "#0D9373",
       "logo": "/logo.svg"
     }
   }
   ```

4. **Use Examples**: Include practical code examples in documentation
   - Extract from test files
   - Create dedicated example files
   - Show common use cases

5. **Keep it Fresh**: Use sync tool to detect outdated content
   ```bash
   npm run sync-docs
   ```

6. **Leverage Git Hooks**: Automatically validate docs on commit
   ```bash
   # Install pre-commit hook
   cp examples/pre-commit/.pre-commit-config.yaml .
   ```

## Development

### Project Structure

```
autonomous-docs-mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── analyzers/
│   │   └── codebase-analyzer.ts # Codebase analysis logic
│   ├── generators/
│   │   ├── mdx-generator.ts    # MDX file generation
│   │   └── docs-config-generator.ts # Config generation
│   └── validators/
│       └── doc-validator.ts     # Documentation validation
├── dist/                         # Compiled JavaScript
├── examples/                     # Usage examples
├── tests/                        # Test suite
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
# Build TypeScript
npm run build

# Clean build artifacts
npm run clean

# Rebuild from scratch
npm run clean && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Linting

```bash
# Lint TypeScript files
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Security

- **No Sensitive Data**: Never includes sensitive data in generated docs
- **Link Validation**: Validates all links before generation
- **Code Sanitization**: Sanitizes code examples to prevent injection
- **Gitignore Respect**: Respects .gitignore patterns automatically
- **Private API Control**: Option to exclude private/internal APIs

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**MCP Connection Issues**
```bash
# Check server is running
ps aux | grep autonomous-docs

# Check configuration
cat ~/.claude.json | grep autonomous-docs
```

**Validation Errors**
```bash
# Run validation with verbose output
npm run validate-docs -- --verbose

# Check specific file
npm run validate-docs -- --file docs/api/endpoint.mdx
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code of Conduct
- Development workflow
- Pull request process
- Coding standards
- Testing guidelines

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/perryjr1444/autonomous-docs-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/perryjr1444/autonomous-docs-mcp/discussions)
- **Email**: perryjr1444@github.com

## Acknowledgments

- Built on [Model Context Protocol](https://modelcontextprotocol.io)
- Documentation style inspired by [Mintlify](https://mintlify.com)
- Powered by the TypeScript and Node.js ecosystem

## Roadmap

- [ ] Support for more programming languages (Ruby, PHP, C#)
- [ ] Integration with popular documentation platforms (ReadTheDocs, GitBook)
- [ ] Real-time collaboration features
- [ ] AI-powered documentation suggestions
- [ ] Visual documentation builder
- [ ] Multi-language documentation support (i18n)
- [ ] Documentation analytics and insights

## Author

**perryjr1444**

- GitHub: [@perryjr1444](https://github.com/perryjr1444)
- Twitter: [@perryjr1444](https://twitter.com/perryjr1444)

---

Made with ❤️ by the MCP community
