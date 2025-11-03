# Multi-Repository Documentation Aggregation

Aggregate documentation from multiple repositories into a unified documentation site.

## Quick Start

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk glob fs-extra simple-git

# Configure repositories
cp config.example.json config.json
# Edit config.json with your repos

# Run aggregation
node aggregate.js

# Preview
cd aggregated-docs && mintlify dev
```

## Configuration

`config.json`:
```json
{
  "repositories": [
    {
      "name": "api-service",
      "url": "https://github.com/org/api-service",
      "docsPath": "docs",
      "branch": "main",
      "prefix": "api"
    },
    {
      "name": "web-app",
      "url": "https://github.com/org/web-app",
      "docsPath": "documentation",
      "branch": "main",
      "prefix": "web"
    }
  ],
  "output": "./aggregated-docs",
  "crossLinking": true,
  "shared": {
    "theme": "default",
    "primaryColor": "#0D9373",
    "logo": "./assets/logo.svg"
  }
}
```

## Features

- **Multi-repo cloning**: Automatically clone and pull latest docs
- **Cross-linking**: Resolve cross-repository references
- **Unified navigation**: Single coherent navigation structure
- **Shared theme**: Consistent branding across all docs
- **Incremental updates**: Only fetch changed repositories

## Files

- `aggregate.js` - Main aggregation orchestrator
- `repo-analyzer.js` - Analyze individual repositories
- `cross-linker.js` - Resolve cross-repo links
- `deploy.sh` - Deploy aggregated documentation
- `config.json` - Repository configuration

## Usage

### Basic Aggregation

```bash
node aggregate.js
```

### With Authentication

```bash
export GITHUB_TOKEN="your_token"
node aggregate.js
```

### Incremental Update

```bash
node aggregate.js --incremental
```

### Deploy

```bash
./deploy.sh production
```

## Output Structure

```
aggregated-docs/
├── api/           # From api-service repo
│   ├── endpoints.mdx
│   └── auth.mdx
├── web/           # From web-app repo
│   ├── components.mdx
│   └── hooks.mdx
├── shared/        # Shared documentation
│   └── getting-started.mdx
└── docs.json      # Unified navigation
```
