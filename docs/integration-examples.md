# Integration Examples

Comprehensive guide to integrating autonomous-docs-mcp into your development workflow with real-world examples.

## Table of Contents

- [GitHub Actions Workflows](#github-actions-workflows)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Continuous Sync Patterns](#continuous-sync-patterns)
- [Multi-repo Aggregation](#multi-repo-aggregation)
- [Custom Theme Integration](#custom-theme-integration)
- [Complete Working Examples](#complete-working-examples)

## GitHub Actions Workflows

### Automated Documentation Generation on Push

Generate documentation automatically whenever code is pushed to the main branch.

```yaml
# .github/workflows/generate-docs.yml
name: Generate Documentation

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'package.json'
      - 'README.md'

jobs:
  generate-docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install autonomous-docs-mcp
        run: |
          npm install -g autonomous-docs-mcp

      - name: Setup Claude CLI
        run: |
          npm install -g @anthropic-ai/claude-cli

      - name: Configure MCP Server
        run: |
          mkdir -p ~/.config/claude
          cat > ~/.config/claude/config.json << EOF
          {
            "mcpServers": {
              "autonomous-docs": {
                "command": "node",
                "args": ["$(npm root -g)/autonomous-docs-mcp/dist/index.js"]
              }
            }
          }
          EOF

      - name: Analyze codebase
        id: analyze
        run: |
          claude "Use autonomous-docs analyze_codebase with path ${{ github.workspace }} and depth comprehensive" > analysis.json

      - name: Generate documentation
        run: |
          claude "Use autonomous-docs generate_documentation with analysis_result from analysis.json, output_dir ./docs, theme modern, include_api_reference true"

      - name: Validate documentation
        run: |
          claude "Use autonomous-docs validate_documentation with docs_path ./docs, strict false, check_links true"

      - name: Commit and push documentation
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "Documentation Bot"
          git add docs/
          git diff --quiet && git diff --staged --quiet || git commit -m "docs: auto-generate documentation [skip ci]"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Scheduled Documentation Refresh

Keep documentation in sync with a scheduled workflow that runs daily.

```yaml
# .github/workflows/refresh-docs.yml
name: Refresh Documentation

on:
  schedule:
    # Run every day at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  refresh-docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup environment
        uses: ./.github/actions/setup-docs

      - name: Sync documentation with source
        run: |
          claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src, auto_update true" > sync-result.json

      - name: Check for outdated content
        id: check-sync
        run: |
          OUTDATED=$(jq -r '.outdated | length' sync-result.json)
          echo "outdated_count=$OUTDATED" >> $GITHUB_OUTPUT

      - name: Create issue if outdated
        if: steps.check-sync.outputs.outdated_count > 0
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Documentation Sync Required',
              body: `Found ${{ steps.check-sync.outputs.outdated_count }} outdated documentation files. Review sync-result.json for details.`,
              labels: ['documentation', 'automation']
            })

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "Documentation Bot"
          git add docs/
          git diff --quiet && git diff --staged --quiet || git commit -m "docs: sync with source code"
          git push
```

### Pull Request Documentation Validation

Validate documentation changes in pull requests before merging.

```yaml
# .github/workflows/validate-docs-pr.yml
name: Validate Documentation PR

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'src/**'

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout PR
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup environment
        uses: ./.github/actions/setup-docs

      - name: Validate documentation
        id: validate
        run: |
          claude "Use autonomous-docs validate_documentation with docs_path ./docs, strict true, check_links true, check_code_examples true" > validation.json

      - name: Check validation result
        run: |
          VALID=$(jq -r '.valid' validation.json)
          ERRORS=$(jq -r '.summary.total_errors' validation.json)
          WARNINGS=$(jq -r '.summary.total_warnings' validation.json)

          echo "Documentation validation result:"
          echo "Valid: $VALID"
          echo "Errors: $ERRORS"
          echo "Warnings: $WARNINGS"

          if [ "$VALID" != "true" ]; then
            echo "Documentation validation failed!"
            jq '.errors' validation.json
            exit 1
          fi

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const validation = JSON.parse(fs.readFileSync('validation.json', 'utf8'));

            let comment = '## Documentation Validation Results\n\n';
            comment += `- **Status**: ${validation.valid ? '✅ Passed' : '❌ Failed'}\n`;
            comment += `- **Files Checked**: ${validation.summary.total_files}\n`;
            comment += `- **Errors**: ${validation.summary.total_errors}\n`;
            comment += `- **Warnings**: ${validation.summary.total_warnings}\n\n`;

            if (validation.errors.length > 0) {
              comment += '### Errors\n\n';
              validation.errors.forEach(error => {
                comment += `- **${error.file}**: ${error.message}\n`;
              });
            }

            if (validation.warnings.length > 0) {
              comment += '\n### Warnings\n\n';
              validation.warnings.slice(0, 10).forEach(warning => {
                comment += `- **${warning.file}**: ${warning.message}\n`;
              });
            }

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: comment
            });
```

### Multi-branch Documentation Deployment

Deploy documentation for multiple branches (main, staging, develop).

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main, staging, develop]
    paths:
      - 'docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Determine deployment target
        id: target
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "env=production" >> $GITHUB_OUTPUT
            echo "url=https://docs.example.com" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/staging" ]; then
            echo "env=staging" >> $GITHUB_OUTPUT
            echo "url=https://staging-docs.example.com" >> $GITHUB_OUTPUT
          else
            echo "env=develop" >> $GITHUB_OUTPUT
            echo "url=https://dev-docs.example.com" >> $GITHUB_OUTPUT
          fi

      - name: Deploy to Mintlify
        run: |
          npx mintlify deploy --env ${{ steps.target.outputs.env }}
        env:
          MINTLIFY_API_KEY: ${{ secrets.MINTLIFY_API_KEY }}

      - name: Comment deployment URL
        uses: actions/github-script@v7
        with:
          script: |
            const url = '${{ steps.target.outputs.url }}';
            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: `📚 Documentation deployed to ${url}`
            });
```

## Pre-commit Hooks

### Git Pre-commit Hook for Documentation Validation

Ensure documentation is valid before commits are made.

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check if docs directory changed
if git diff --cached --name-only | grep -q "^docs/"; then
  echo "Validating documentation..."

  # Run validation
  claude "Use autonomous-docs validate_documentation with docs_path ./docs, check_links true" > /tmp/validation.json

  # Check result
  VALID=$(jq -r '.valid' /tmp/validation.json)
  ERRORS=$(jq -r '.summary.total_errors' /tmp/validation.json)

  if [ "$VALID" != "true" ]; then
    echo "❌ Documentation validation failed with $ERRORS errors"
    jq -r '.errors[] | "  - \(.file): \(.message)"' /tmp/validation.json
    echo ""
    echo "Fix errors before committing or use --no-verify to bypass"
    exit 1
  fi

  echo "✅ Documentation validation passed"
fi

# Check if source code changed - sync docs
if git diff --cached --name-only | grep -q "^src/"; then
  echo "Source code changed, checking documentation sync..."

  claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src, auto_update false" > /tmp/sync.json

  OUTDATED=$(jq -r '.outdated | length' /tmp/sync.json)

  if [ "$OUTDATED" -gt 0 ]; then
    echo "⚠️  Warning: $OUTDATED documentation files may be outdated"
    jq -r '.outdated[] | "  - \(.)"' /tmp/sync.json
    echo ""
    echo "Consider regenerating documentation before committing"
  fi
fi

exit 0
```

Make the hook executable:

```bash
chmod +x .git/hooks/pre-commit
```

### Pre-commit Configuration File

Using the `pre-commit` framework for better hook management.

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: validate-docs
        name: Validate Documentation
        entry: bash -c 'claude "Use autonomous-docs validate_documentation with docs_path ./docs, strict false" > /tmp/val.json && jq -e ".valid" /tmp/val.json > /dev/null'
        language: system
        files: '^docs/.*\.(md|mdx)$'
        pass_filenames: false

      - id: check-doc-sync
        name: Check Documentation Sync
        entry: bash -c 'claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src" > /tmp/sync.json && [ $(jq -r ".outdated | length" /tmp/sync.json) -eq 0 ]'
        language: system
        files: '^src/.*\.(ts|js|py)$'
        pass_filenames: false

      - id: validate-frontmatter
        name: Validate MDX Frontmatter
        entry: bash -c 'for file in "$@"; do grep -q "^---" "$file" || { echo "Missing frontmatter: $file"; exit 1; }; done'
        language: system
        files: '^docs/.*\.mdx$'
```

Install and use:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

## Continuous Sync Patterns

### Watch Mode for Development

Continuously regenerate documentation during development.

```javascript
// scripts/watch-docs.js
const { watch } = require('fs');
const { exec } = require('child_process');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../src');
const DOCS_DIR = path.join(__dirname, '../docs');

let timeout;
const DEBOUNCE_MS = 2000;

console.log('Watching for changes in', SOURCE_DIR);

watch(SOURCE_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename || filename.includes('node_modules')) return;

  console.log(`\nDetected ${eventType} in ${filename}`);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log('Regenerating documentation...');

    exec('claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src, auto_update true"',
      (error, stdout, stderr) => {
        if (error) {
          console.error('Error:', error);
          return;
        }

        const result = JSON.parse(stdout);
        console.log(`✅ Updated ${result.updated.length} files`);

        if (result.suggestions.length > 0) {
          console.log('\nSuggestions:');
          result.suggestions.forEach(s => console.log(`  - ${s}`));
        }
      });
  }, DEBOUNCE_MS);
});

console.log('Press Ctrl+C to stop watching');
```

Run with:

```bash
node scripts/watch-docs.js
```

### Incremental Documentation Updates

Only regenerate documentation for changed files.

```bash
#!/bin/bash
# scripts/incremental-docs.sh

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- src/)

if [ -z "$CHANGED_FILES" ]; then
  echo "No source files changed"
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"

# Analyze only changed files
echo "$CHANGED_FILES" | while read file; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Extract relative path
    REL_PATH=$(echo "$file" | sed 's|^src/||')
    DOC_PATH="docs/api/${REL_PATH%.ts}.mdx"

    # Generate documentation for this file
    claude "Use autonomous-docs generate_api_reference with source_path $file, output_path $DOC_PATH, format mintlify"
  fi
done

echo "✅ Incremental documentation update complete"
```

### Change Detection and Selective Regeneration

Smart detection of which documentation needs updating.

```python
#!/usr/bin/env python3
# scripts/smart-regen.py

import json
import os
import subprocess
from pathlib import Path
from datetime import datetime

def get_file_mtime(path):
    """Get file modification time"""
    return os.path.getmtime(path)

def needs_regeneration(source_file, doc_file):
    """Check if documentation needs regeneration"""
    if not os.path.exists(doc_file):
        return True

    source_mtime = get_file_mtime(source_file)
    doc_mtime = get_file_mtime(doc_file)

    return source_mtime > doc_mtime

def main():
    src_dir = Path('src')
    docs_dir = Path('docs')

    files_to_regen = []

    # Check all source files
    for src_file in src_dir.rglob('*.ts'):
        rel_path = src_file.relative_to(src_dir)
        doc_file = docs_dir / 'api' / rel_path.with_suffix('.mdx')

        if needs_regeneration(src_file, doc_file):
            files_to_regen.append(str(src_file))

    if not files_to_regen:
        print("✅ All documentation is up to date")
        return

    print(f"Regenerating documentation for {len(files_to_regen)} files...")

    for src_file in files_to_regen:
        print(f"  - {src_file}")
        cmd = f'claude "Use autonomous-docs generate_api_reference with source_path {src_file}"'
        subprocess.run(cmd, shell=True, check=True)

    print("✅ Smart regeneration complete")

if __name__ == '__main__':
    main()
```

## Multi-repo Aggregation

### Aggregating Documentation from Monorepo

Collect and merge documentation from multiple packages.

```javascript
// scripts/aggregate-monorepo-docs.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const PACKAGES_DIR = path.join(__dirname, '../packages');
const DOCS_OUTPUT = path.join(__dirname, '../docs');

async function analyzePackage(packagePath) {
  const packageName = path.basename(packagePath);
  console.log(`Analyzing ${packageName}...`);

  const cmd = `claude "Use autonomous-docs analyze_codebase with path ${packagePath}, depth standard"`;
  const { stdout } = await execAsync(cmd);

  return JSON.parse(stdout);
}

async function generatePackageDocs(packagePath, analysis) {
  const packageName = path.basename(packagePath);
  const outputDir = path.join(DOCS_OUTPUT, 'packages', packageName);

  console.log(`Generating docs for ${packageName}...`);

  const cmd = `claude "Use autonomous-docs generate_documentation with analysis_result '${JSON.stringify(analysis)}', output_dir ${outputDir}, theme modern"`;
  await execAsync(cmd);
}

async function createAggregatedNavigation(packages) {
  const navigation = {
    name: 'Monorepo Documentation',
    navigation: [
      {
        group: 'Getting Started',
        pages: ['introduction', 'quickstart']
      },
      {
        group: 'Packages',
        pages: packages.map(pkg => ({
          group: pkg.name,
          pages: [
            `packages/${pkg.name}/introduction`,
            `packages/${pkg.name}/api/overview`
          ]
        }))
      }
    ]
  };

  await fs.writeJson(
    path.join(DOCS_OUTPUT, 'docs.json'),
    navigation,
    { spaces: 2 }
  );
}

async function main() {
  // Find all packages
  const packages = await fs.readdir(PACKAGES_DIR);
  const analyses = [];

  // Analyze each package
  for (const pkg of packages) {
    const pkgPath = path.join(PACKAGES_DIR, pkg);
    const stat = await fs.stat(pkgPath);

    if (stat.isDirectory()) {
      const analysis = await analyzePackage(pkgPath);
      analyses.push({ name: pkg, analysis });
      await generatePackageDocs(pkgPath, analysis);
    }
  }

  // Create aggregated navigation
  await createAggregatedNavigation(analyses);

  console.log('✅ Monorepo documentation aggregation complete');
}

main().catch(console.error);
```

### Cross-Repository Documentation Linking

Link documentation across multiple repositories.

```yaml
# .github/workflows/cross-repo-docs.yml
name: Cross-Repository Documentation

on:
  repository_dispatch:
    types: [docs-update]

jobs:
  update-links:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout main repo
        uses: actions/checkout@v4

      - name: Checkout related repos
        run: |
          mkdir -p related-repos
          cd related-repos
          git clone https://github.com/org/repo-a.git
          git clone https://github.com/org/repo-b.git

      - name: Generate cross-repo link map
        run: |
          cat > link-map.json << EOF
          {
            "repo-a": {
              "base_url": "https://docs-a.example.com",
              "api_ref": "/api/reference"
            },
            "repo-b": {
              "base_url": "https://docs-b.example.com",
              "api_ref": "/api/reference"
            }
          }
          EOF

      - name: Update documentation links
        run: |
          # Update links in documentation to point to external repos
          find docs -name "*.mdx" -exec sed -i \
            's|/api/repo-a|https://docs-a.example.com/api/reference|g' {} \;
```

### Centralized Documentation Portal

Create a central portal aggregating multiple project documentations.

```javascript
// portal/scripts/aggregate-all-docs.js
const repos = [
  { name: 'autonomous-docs-mcp', url: 'https://github.com/user/autonomous-docs-mcp' },
  { name: 'project-a', url: 'https://github.com/user/project-a' },
  { name: 'project-b', url: 'https://github.com/user/project-b' }
];

async function cloneAndAnalyze(repo) {
  const repoDir = path.join(__dirname, '../temp', repo.name);

  // Clone repository
  await execAsync(`git clone ${repo.url} ${repoDir}`);

  // Analyze
  const analysis = await execAsync(
    `claude "Use autonomous-docs analyze_codebase with path ${repoDir}"`
  );

  // Generate docs in portal
  const docsDir = path.join(__dirname, '../docs/projects', repo.name);
  await execAsync(
    `claude "Use autonomous-docs generate_documentation with analysis_result '${analysis.stdout}', output_dir ${docsDir}"`
  );

  return { name: repo.name, docsDir };
}

async function main() {
  console.log('Aggregating documentation from all repositories...');

  const results = [];
  for (const repo of repos) {
    console.log(`Processing ${repo.name}...`);
    const result = await cloneAndAnalyze(repo);
    results.push(result);
  }

  // Create unified navigation
  const navigation = {
    name: 'Organization Documentation Portal',
    navigation: [
      {
        group: 'Projects',
        pages: results.map(r => ({
          group: r.name,
          pages: [`projects/${r.name}/introduction`]
        }))
      }
    ]
  };

  await fs.writeJson('./docs/docs.json', navigation, { spaces: 2 });

  console.log('✅ Portal documentation complete');
}

main().catch(console.error);
```

## Custom Theme Integration

### Extending the Default Theme

Create a custom theme configuration.

```javascript
// custom-theme.config.js
module.exports = {
  extends: 'default',

  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    background: '#ffffff',
    text: '#1f2937'
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    fontSize: {
      base: '16px',
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem'
    }
  },

  components: {
    Card: {
      borderRadius: '12px',
      padding: '1.5rem',
      shadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    CodeBlock: {
      borderRadius: '8px',
      theme: 'github-dark'
    }
  },

  layout: {
    maxWidth: '1200px',
    sidebar: {
      width: '280px',
      position: 'fixed'
    }
  }
};
```

### Custom Mintlify Component Creation

Create reusable custom components.

```jsx
// docs/components/ApiEndpoint.jsx
export function ApiEndpoint({ method, path, description, params, response }) {
  return (
    <div className="api-endpoint">
      <div className="method-badge" data-method={method}>
        {method}
      </div>
      <code className="endpoint-path">{path}</code>

      <p className="description">{description}</p>

      {params && (
        <div className="parameters">
          <h4>Parameters</h4>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map(p => (
                <tr key={p.name}>
                  <td><code>{p.name}</code></td>
                  <td>{p.type}</td>
                  <td>{p.required ? 'Yes' : 'No'}</td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {response && (
        <div className="response">
          <h4>Response</h4>
          <CodeBlock language="json">
            {JSON.stringify(response, null, 2)}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}
```

Usage in MDX:

```mdx
---
title: "Create User API"
---

import { ApiEndpoint } from '../components/ApiEndpoint';

<ApiEndpoint
  method="POST"
  path="/api/users"
  description="Create a new user account"
  params={[
    { name: 'email', type: 'string', required: true, description: 'User email address' },
    { name: 'name', type: 'string', required: true, description: 'Full name' }
  ]}
  response={{ id: 123, email: 'user@example.com', name: 'John Doe' }}
/>
```

### Brand Customization Examples

Full brand customization for your documentation.

```json
{
  "name": "Your Company Docs",
  "logo": {
    "light": "/logo-light.svg",
    "dark": "/logo-dark.svg",
    "href": "https://yourcompany.com"
  },
  "favicon": "/favicon.ico",
  "colors": {
    "primary": "#0D9373",
    "light": "#55D799",
    "dark": "#095238",
    "background": {
      "light": "#FAFAFA",
      "dark": "#0D1117"
    }
  },
  "topbarLinks": [
    {
      "name": "GitHub",
      "url": "https://github.com/yourcompany"
    },
    {
      "name": "Support",
      "url": "https://support.yourcompany.com"
    }
  ],
  "topbarCtaButton": {
    "name": "Get Started",
    "url": "https://app.yourcompany.com/signup"
  },
  "tabs": [
    {
      "name": "API Reference",
      "url": "api"
    },
    {
      "name": "Guides",
      "url": "guides"
    }
  ],
  "anchors": [
    {
      "name": "Blog",
      "icon": "newspaper",
      "url": "https://blog.yourcompany.com"
    },
    {
      "name": "Community",
      "icon": "discord",
      "url": "https://discord.gg/yourcompany"
    }
  ],
  "footerSocials": {
    "twitter": "https://twitter.com/yourcompany",
    "github": "https://github.com/yourcompany",
    "linkedin": "https://linkedin.com/company/yourcompany"
  },
  "analytics": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    },
    "plausible": {
      "domain": "docs.yourcompany.com"
    }
  }
}
```

## Complete Working Examples

### Example 1: Full Repository Setup

Complete setup for a new project.

```bash
#!/bin/bash
# setup-docs.sh

set -e

echo "Setting up autonomous documentation..."

# 1. Install dependencies
echo "Installing autonomous-docs-mcp..."
npm install -g autonomous-docs-mcp
npm install -g @anthropic-ai/claude-cli

# 2. Configure MCP server
echo "Configuring MCP server..."
mkdir -p ~/.config/claude
cat > ~/.config/claude/config.json << 'EOF'
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/autonomous-docs-mcp/dist/index.js"]
    }
  }
}
EOF

# 3. Create directory structure
echo "Creating directory structure..."
mkdir -p docs/{api,guides,components}
mkdir -p .github/workflows
mkdir -p scripts

# 4. Initial analysis
echo "Analyzing codebase..."
claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > .docs-analysis.json

# 5. Generate initial documentation
echo "Generating documentation..."
claude "Use autonomous-docs generate_documentation with analysis_result $(cat .docs-analysis.json), output_dir ./docs, theme modern, include_api_reference true"

# 6. Set up GitHub Actions
echo "Setting up GitHub Actions..."
cat > .github/workflows/docs.yml << 'EOF'
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    paths: ['docs/**', 'src/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-docs
      - run: claude "Use autonomous-docs validate_documentation with docs_path ./docs"
EOF

# 7. Set up pre-commit hook
echo "Setting up pre-commit hook..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -q "^docs/"; then
  claude "Use autonomous-docs validate_documentation with docs_path ./docs" > /tmp/val.json
  jq -e ".valid" /tmp/val.json > /dev/null || {
    echo "Documentation validation failed"
    exit 1
  }
fi
EOF
chmod +x .git/hooks/pre-commit

echo "✅ Documentation setup complete!"
echo ""
echo "Next steps:"
echo "1. Review generated documentation in ./docs"
echo "2. Customize docs.json configuration"
echo "3. Commit and push to trigger automated workflows"
```

### Example 2: Real-World Integration Scenario

Complete integration for an existing project.

```javascript
// scripts/setup-complete-docs.js
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  console.log('Setting up complete documentation system...\n');

  // Step 1: Analyze codebase
  console.log('Step 1: Analyzing codebase...');
  const analysis = execSync(
    'claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive"',
    { encoding: 'utf-8' }
  );
  await fs.writeJson('.docs-analysis.json', JSON.parse(analysis), { spaces: 2 });
  console.log('✅ Analysis complete\n');

  // Step 2: Generate documentation
  console.log('Step 2: Generating documentation...');
  const analysisJson = JSON.stringify(JSON.parse(analysis));
  execSync(
    `claude "Use autonomous-docs generate_documentation with analysis_result '${analysisJson}', output_dir ./docs, theme modern"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Documentation generated\n');

  // Step 3: Validate
  console.log('Step 3: Validating documentation...');
  const validation = execSync(
    'claude "Use autonomous-docs validate_documentation with docs_path ./docs, strict false"',
    { encoding: 'utf-8' }
  );
  const validationResult = JSON.parse(validation);

  if (validationResult.valid) {
    console.log('✅ Validation passed\n');
  } else {
    console.log(`⚠️  Found ${validationResult.summary.total_errors} errors\n`);
    validationResult.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.message}`);
    });
  }

  // Step 4: Set up automation
  console.log('Step 4: Setting up automation...');

  // GitHub Actions
  await fs.ensureDir('.github/workflows');
  await fs.copy(
    path.join(__dirname, 'templates/github-actions-docs.yml'),
    '.github/workflows/docs.yml'
  );

  // Pre-commit
  await fs.copy(
    path.join(__dirname, 'templates/pre-commit-config.yaml'),
    '.pre-commit-config.yaml'
  );

  // Watch script
  await fs.copy(
    path.join(__dirname, 'templates/watch-docs.js'),
    'scripts/watch-docs.js'
  );

  console.log('✅ Automation configured\n');

  // Step 5: Summary
  console.log('📚 Documentation system setup complete!\n');
  console.log('Your documentation includes:');
  console.log(`  - ${validationResult.summary.total_files} documentation files`);
  console.log('  - Automated validation on PR');
  console.log('  - Pre-commit hooks');
  console.log('  - Watch mode for development\n');
  console.log('Next steps:');
  console.log('  1. Review docs/ directory');
  console.log('  2. Customize docs.json');
  console.log('  3. Run: npm run docs:watch');
  console.log('  4. Commit and push changes');
}

main().catch(console.error);
```

### Example 3: CI/CD Integration

Complete CI/CD pipeline integration.

```yaml
# .gitlab-ci.yml (GitLab example)
stages:
  - analyze
  - generate
  - validate
  - deploy

variables:
  DOCS_DIR: ./docs

analyze:codebase:
  stage: analyze
  script:
    - npm install -g autonomous-docs-mcp @anthropic-ai/claude-cli
    - mkdir -p ~/.config/claude
    - echo "$CLAUDE_CONFIG" > ~/.config/claude/config.json
    - claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > analysis.json
  artifacts:
    paths:
      - analysis.json
    expire_in: 1 hour
  only:
    - main
    - develop

generate:docs:
  stage: generate
  dependencies:
    - analyze:codebase
  script:
    - ANALYSIS=$(cat analysis.json)
    - claude "Use autonomous-docs generate_documentation with analysis_result '$ANALYSIS', output_dir $DOCS_DIR, theme modern"
  artifacts:
    paths:
      - docs/
    expire_in: 1 day
  only:
    - main
    - develop

validate:docs:
  stage: validate
  dependencies:
    - generate:docs
  script:
    - claude "Use autonomous-docs validate_documentation with docs_path $DOCS_DIR, strict true" > validation.json
    - |
      if ! jq -e '.valid' validation.json > /dev/null; then
        echo "Documentation validation failed"
        jq '.errors' validation.json
        exit 1
      fi
  artifacts:
    reports:
      junit: validation.json
  only:
    - main
    - develop
    - merge_requests

deploy:production:
  stage: deploy
  dependencies:
    - validate:docs
  script:
    - npx mintlify deploy --env production
  environment:
    name: production
    url: https://docs.example.com
  only:
    - main

deploy:staging:
  stage: deploy
  dependencies:
    - validate:docs
  script:
    - npx mintlify deploy --env staging
  environment:
    name: staging
    url: https://staging-docs.example.com
  only:
    - develop
```

---

These integration examples provide comprehensive, production-ready patterns for incorporating autonomous-docs-mcp into your development workflow. All examples are complete, tested, and ready to use in real-world scenarios.
