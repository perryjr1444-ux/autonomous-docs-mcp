# Autonomous Documentation MCP

Autonomous documentation generation tool with Mintlify-style presentation for codebases.

## Features

- **Autonomous Codebase Analysis**: Automatically scan and understand your entire codebase
- **Mintlify-Style Generation**: Generate beautiful, modern documentation with MDX
- **API Reference Auto-Generation**: Extract API definitions from code annotations
- **Smart Navigation**: Automatically organize docs with intelligent navigation structure
- **Documentation Validation**: Ensure quality with built-in validation
- **Sync with Source**: Keep docs updated as code changes
- **Multi-Language Support**: TypeScript, JavaScript, Python, Go, Rust, Java

## Installation

```bash
cd autonomous-docs-mcp
npm install
npm run build
```

## Configuration

Add to your `.claude.json`:

```json
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["/Users/c0nfig/autonomous-docs-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### analyze_codebase

Analyze entire codebase structure and identify documentation needs.

```typescript
{
  path: "/path/to/project",
  depth: "standard", // quick | standard | comprehensive
  include_patterns: ["**/*.ts", "**/*.py"],
  exclude_patterns: ["node_modules/**"]
}
```

### generate_documentation

Generate complete Mintlify-style documentation.

```typescript
{
  analysis_result: "<json-from-analyze>",
  output_dir: "./docs",
  theme: "default", // default | minimal | technical | modern
  include_api_reference: true,
  include_examples: true
}
```

### generate_api_reference

Generate API reference from code annotations.

```typescript
{
  source_path: "./src",
  output_path: "./docs/api",
  format: "mintlify", // mintlify | openapi | markdown
  include_private: false
}
```

### create_docs_config

Generate docs.json configuration.

```typescript
{
  project_name: "My Project",
  structure: "<navigation-structure>",
  theme_config: { primaryColor: "#0D9373" }
}
```

### validate_documentation

Validate documentation quality.

```typescript
{
  docs_path: "./docs",
  strict: false,
  check_links: true,
  check_code_examples: true
}
```

### sync_documentation

Sync docs with source code changes.

```typescript
{
  docs_path: "./docs",
  source_path: "./src",
  auto_update: false
}
```

## Usage Example

```bash
# 1. Analyze your codebase
analyze_codebase({
  path: "/Users/c0nfig/my-project",
  depth: "comprehensive"
})

# 2. Generate documentation
generate_documentation({
  analysis_result: "<result-from-step-1>",
  output_dir: "./docs",
  theme: "modern"
})

# 3. Validate generated docs
validate_documentation({
  docs_path: "./docs"
})
```

## Documentation Structure

Generated documentation follows Mintlify best practices:

```
docs/
├── introduction.mdx       # Project overview
├── quickstart.mdx         # Getting started guide
├── api/
│   ├── overview.mdx      # API reference overview
│   └── endpoints.mdx     # Individual endpoints
├── guides/
│   ├── overview.mdx      # Guides overview
│   └── best-practices.mdx
├── components/           # Component documentation
└── docs.json            # Navigation config
```

## Frontmatter Requirements

All generated MDX files include proper frontmatter:

```yaml
---
title: "Page Title"
description: "Page description for SEO"
---
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Mintlify Components

Generated docs support Mintlify components:

- `<Card>` - Feature cards
- `<CardGroup>` - Card containers
- `<Accordion>` - Collapsible sections
- `<CodeGroup>` - Multi-language code examples
- `<Tabs>` - Tabbed content

## Best Practices

1. **Run analysis regularly**: Keep docs in sync with code changes
2. **Validate before deploying**: Use validation tool to catch issues
3. **Customize themes**: Match your brand with theme config
4. **Use examples**: Include practical code examples
5. **Keep it fresh**: Use sync tool to detect outdated content

## Security

- Never includes sensitive data in generated docs
- Validates all links before generation
- Sanitizes code examples
- Respects .gitignore patterns

## License

MIT

## Author

perryjr1444
