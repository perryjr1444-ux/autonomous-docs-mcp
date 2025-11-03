# Basic Usage Example

This example demonstrates the basic workflow for using Autonomous Documentation MCP to generate documentation for your project.

## Scenario

You have a TypeScript project and want to generate comprehensive Mintlify-style documentation automatically.

## Prerequisites

- Autonomous Docs MCP installed and configured
- MCP client (Claude Code or compatible)
- Your project source code

## Step-by-Step Guide

### Step 1: Analyze Your Codebase

First, analyze your project to understand its structure:

```typescript
const analysis = await analyze_codebase({
  path: "/path/to/your/project",
  depth: "standard",
  include_patterns: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  exclude_patterns: [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.test.ts",
    "*.spec.ts"
  ]
});
```

**Expected Output:**
```json
{
  "project_name": "my-project",
  "total_files": 45,
  "structure": {
    "src": {
      "components": ["Button.tsx", "Modal.tsx"],
      "utils": ["helpers.ts", "validators.ts"],
      "api": ["client.ts", "endpoints.ts"]
    }
  },
  "apis": [
    {
      "name": "createUser",
      "type": "function",
      "file": "src/api/endpoints.ts"
    }
  ],
  "recommendations": [
    "Document API endpoints in src/api/",
    "Add usage examples for components"
  ]
}
```

### Step 2: Generate Documentation

Use the analysis result to generate documentation:

```typescript
const docs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  output_dir: "./docs",
  theme: "modern",
  include_api_reference: true,
  include_examples: true
});
```

**Expected Output:**
```json
{
  "status": "success",
  "files_created": 23,
  "structure": {
    "introduction.mdx": "Created",
    "quickstart.mdx": "Created",
    "api/overview.mdx": "Created",
    "api/endpoints/createUser.mdx": "Created",
    "components/Button.mdx": "Created",
    "components/Modal.mdx": "Created",
    "docs.json": "Created"
  },
  "warnings": []
}
```

### Step 3: Validate Documentation

Ensure the generated documentation is valid:

```typescript
const validation = await validate_documentation({
  docs_path: "./docs",
  strict: false,
  check_links: true,
  check_code_examples: true
});
```

**Expected Output:**
```json
{
  "status": "valid",
  "errors": [],
  "warnings": [
    "External link in api/overview.mdx should be verified"
  ],
  "stats": {
    "total_files": 23,
    "valid_files": 23,
    "broken_links": 0,
    "invalid_examples": 0
  }
}
```

### Step 4: Review Generated Documentation

Your documentation structure will look like this:

```
docs/
├── introduction.mdx              # Auto-generated project overview
├── quickstart.mdx                # Getting started guide
├── installation.mdx              # Installation instructions
├── api/
│   ├── overview.mdx             # API reference overview
│   └── endpoints/
│       ├── createUser.mdx       # Individual API documentation
│       └── updateUser.mdx
├── components/
│   ├── Button.mdx               # Component documentation
│   └── Modal.mdx
├── examples/
│   ├── basic-usage.mdx          # Usage examples
│   └── advanced-usage.mdx
└── docs.json                     # Navigation configuration
```

### Step 5: Customize (Optional)

Edit the generated files to add project-specific content:

**docs/introduction.mdx:**
```mdx
---
title: "Welcome to My Project"
description: "A powerful tool for doing amazing things"
icon: "rocket"
---

# Welcome to My Project

This is the auto-generated introduction. You can customize this content
while keeping the structure intact.

<CardGroup cols={2}>
  <Card title="Quick Start" icon="bolt" href="/quickstart">
    Get started in 5 minutes
  </Card>
  <Card title="API Reference" icon="code" href="/api/overview">
    Explore our API
  </Card>
</CardGroup>

## Features

- Feature 1 (auto-detected from code)
- Feature 2 (auto-detected from code)
- Your custom feature here

## Next Steps

<Steps>
  <Step title="Install">
    Install the package with npm or yarn
  </Step>
  <Step title="Configure">
    Set up your configuration file
  </Step>
  <Step title="Deploy">
    Deploy to production
  </Step>
</Steps>
```

### Step 6: Deploy to Mintlify

Deploy your documentation to Mintlify hosting:

```bash
# Install Mintlify CLI
npm install -g mintlify

# Initialize Mintlify (if not already)
cd docs
mintlify dev

# Deploy to production
mintlify deploy
```

## Complete Example Script

Here's a complete Node.js script that demonstrates the entire workflow:

**generate-docs.js:**
```javascript
#!/usr/bin/env node

import { MCPClient } from '@modelcontextprotocol/client';

async function generateDocumentation() {
  const client = new MCPClient();

  try {
    console.log('Step 1: Analyzing codebase...');
    const analysis = await client.callTool('analyze_codebase', {
      path: process.cwd(),
      depth: 'comprehensive',
      include_patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      exclude_patterns: ['node_modules/**', 'dist/**']
    });

    console.log(`Found ${analysis.total_files} files to document`);

    console.log('Step 2: Generating documentation...');
    const docs = await client.callTool('generate_documentation', {
      analysis_result: JSON.stringify(analysis),
      output_dir: './docs',
      theme: 'modern',
      include_api_reference: true,
      include_examples: true
    });

    console.log(`Created ${docs.files_created} documentation files`);

    console.log('Step 3: Validating documentation...');
    const validation = await client.callTool('validate_documentation', {
      docs_path: './docs',
      check_links: true,
      check_code_examples: true
    });

    if (validation.errors.length > 0) {
      console.error('Validation errors found:');
      validation.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }

    console.log('Documentation generated successfully!');
    console.log(`Review at: ${process.cwd()}/docs`);

  } catch (error) {
    console.error('Error generating documentation:', error);
    process.exit(1);
  }
}

generateDocumentation();
```

Make it executable:
```bash
chmod +x generate-docs.js
```

Run it:
```bash
./generate-docs.js
```

## Incremental Updates

When your code changes, sync the documentation:

```typescript
const sync = await sync_documentation({
  docs_path: "./docs",
  source_path: "./src",
  auto_update: false  // Set to true for automatic updates
});

// Review what changed
console.log('Outdated files:', sync.outdated);
console.log('New APIs:', sync.new_apis);
console.log('Removed APIs:', sync.removed_apis);

// If auto_update is false, manually update specific files
if (sync.outdated.length > 0) {
  // Regenerate outdated documentation
  await generate_documentation({
    analysis_result: JSON.stringify(sync.updated_analysis),
    output_dir: "./docs",
    theme: "modern"
  });
}
```

## Tips and Best Practices

### 1. Use Appropriate Depth

- **Quick**: For rapid prototypes or small projects
- **Standard**: For most production projects (recommended)
- **Comprehensive**: For large, complex codebases

### 2. Configure Exclude Patterns

Always exclude:
- `node_modules/**`
- `dist/**`, `build/**`
- Test files if you don't want them documented
- Third-party code
- Generated files

### 3. Validate Before Committing

Add a pre-commit hook:
```bash
npm run validate-docs || exit 1
```

### 4. Keep Docs in Sync

Set up a GitHub Action to regenerate docs on push:
```yaml
name: Update Documentation
on: [push]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run generate-docs
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "docs: auto-update documentation"
```

### 5. Customize Generated Content

The generated documentation is a starting point. Enhance it by:
- Adding more detailed explanations
- Including diagrams and screenshots
- Adding real-world examples
- Linking to external resources

## Troubleshooting

### Issue: Analysis Takes Too Long

**Solution**: Use quick mode or add more exclude patterns
```typescript
{
  depth: "quick",
  exclude_patterns: ["**/*.test.ts", "**/*.spec.ts", "**/fixtures/**"]
}
```

### Issue: Missing API Documentation

**Solution**: Ensure your code has proper JSDoc comments
```typescript
/**
 * Create a new user
 * @param {object} userData - User information
 * @returns {Promise<User>} Created user
 */
async function createUser(userData) {
  // ...
}
```

### Issue: Broken Links

**Solution**: Use relative links in your documentation
```mdx
[See API Reference](./api/overview)  ✓ Good
[See API Reference](/api/overview)   ✓ Good
[See API Reference](api/overview)    ✗ May break
```

## Next Steps

- Explore [Advanced Usage](../advanced-usage/README.md)
- Learn about [CI/CD Integration](../github-actions/README.md)
- Set up [Continuous Sync](../continuous-sync/README.md)
- Customize with [Custom Themes](../custom-theme/README.md)

## Support

If you encounter issues:
1. Check the [troubleshooting guide](../../README.md#troubleshooting)
2. Search [GitHub Issues](https://github.com/perryjr1444/autonomous-docs-mcp/issues)
3. Open a new issue with details about your problem
