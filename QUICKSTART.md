# Autonomous Documentation MCP - Quick Start

## Installation

```bash
cd autonomous-docs-mcp
npm install
npm run build
```

## Configuration

Add to your `.claude.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["/Users/c0nfig/autonomous-docs-mcp/dist/index.js"],
      "description": "Autonomous documentation generation with Mintlify-style presentation",
      "timeout": 120
    }
  }
}
```

## Quick Usage

### 1. Analyze Your Codebase

```typescript
analyze_codebase({
  path: "/path/to/your/project",
  depth: "standard",  // quick | standard | comprehensive
  include_patterns: ["**/*.ts", "**/*.py"],
  exclude_patterns: ["node_modules/**", "dist/**"]
})
```

**Output**: Complete codebase analysis with:
- Project structure and file tree
- Detected languages and frameworks
- API definitions extracted from code
- Components and their props
- Documentation gaps identified
- Suggested navigation structure

### 2. Generate Documentation

```typescript
generate_documentation({
  analysis_result: "<paste-analysis-json-here>",
  output_dir: "./docs",
  theme: "modern",  // default | minimal | technical | modern
  include_api_reference: true,
  include_examples: true
})
```

**Output**: Complete Mintlify-style documentation:
- `introduction.mdx` - Project overview with CardGroups
- `quickstart.mdx` - Installation and getting started
- `api/*.mdx` - API reference pages
- `components/*.mdx` - Component documentation
- `guides/*.mdx` - Usage guides
- All files with proper frontmatter (title, description)

### 3. Validate Documentation

```typescript
validate_documentation({
  docs_path: "./docs",
  strict: false,
  check_links: true,
  check_code_examples: true
})
```

**Output**: Validation report with:
- Missing frontmatter
- Broken internal links
- Code blocks without language tags
- Missing alt text on images
- Summary statistics

## Example Workflow

```bash
# 1. Analyze a project
analyze_codebase({
  path: "/Users/c0nfig/my-awesome-project",
  depth: "comprehensive"
})

# 2. Save analysis result to file (optional)
# Copy the JSON output

# 3. Generate docs
generate_documentation({
  analysis_result: "<paste-json>",
  output_dir: "./docs",
  theme: "modern"
})

# 4. Validate
validate_documentation({
  docs_path: "./docs"
})

# 5. View your generated docs
# Open docs/introduction.mdx
```

## All Available Tools

### analyze_codebase
Autonomously analyze entire codebase structure and identify documentation needs.

### generate_documentation
Generate complete Mintlify-style documentation with MDX files and configuration.

### generate_api_reference
Generate API reference documentation from code annotations and types.

### create_docs_config
Generate `docs.json` configuration with navigation and theme settings.

### validate_documentation
Validate documentation quality, links, and code examples.

### sync_documentation
Sync documentation with source code changes and detect outdated content.

### generate_changelog
Generate changelog from git history with semantic versioning.

### extract_code_examples
Extract and organize code examples from tests and demos.

## Tips

1. **Start with comprehensive analysis** - More context = better docs
2. **Review analysis first** - Check what was detected before generating
3. **Validate before deploying** - Catch issues early
4. **Use sync regularly** - Keep docs updated as code changes
5. **Customize themes** - Match your brand

## GitHub Integration

Push docs to GitHub Pages:

```bash
# After generating docs
cd docs
git init
git add .
git commit -m "docs: Initial documentation"
git branch -M gh-pages
git remote add origin https://github.com/yourusername/your-project.git
git push -u origin gh-pages
```

## Security Note

✅ **Authenticated for perryjr1444-ux**
- GitHub token scopes: gist, read:org, repo
- Account ID: 225765792
- Account type: User
- Repos: 12 public

## Support

- Issues: https://github.com/perryjr1444-ux/autonomous-docs-mcp/issues
- MCP Docs: https://modelcontextprotocol.io

## License

MIT - © perryjr1444
