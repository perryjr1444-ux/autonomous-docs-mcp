# Autonomous Docs MCP - Integration Examples

Complete integration examples for real-world scenarios with working code and step-by-step instructions.

## Table of Contents

1. [GitHub Actions CI/CD Integration](#1-github-actions-cicd-integration)
2. [Pre-commit Hook Integration](#2-pre-commit-hook-integration)
3. [Continuous Documentation Sync](#3-continuous-documentation-sync)
4. [Multi-Repo Documentation Aggregation](#4-multi-repo-documentation-aggregation)
5. [Custom Theme Integration](#5-custom-theme-integration)
6. [Mintlify Deployment Integration](#6-mintlify-deployment-integration)
7. [API Documentation Plugin](#7-api-documentation-plugin)

---

## 1. GitHub Actions CI/CD Integration

Automatically generate and validate documentation on every PR and deploy to GitHub Pages.

### Files Structure

```
.github/
├── workflows/
│   ├── docs-validation.yml
│   ├── docs-generation.yml
│   └── docs-deploy.yml
└── scripts/
    └── check-docs-sync.js
```

### Complete Workflow Files

See: [`examples/github-actions/`](./github-actions/)

- `docs-validation.yml` - Validate docs on every PR
- `docs-generation.yml` - Auto-generate docs on main branch
- `docs-deploy.yml` - Deploy to GitHub Pages
- `check-docs-sync.js` - Custom sync checker script

### Setup Instructions

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Set source to "GitHub Actions"

2. **Add Repository Secrets**
   ```bash
   # Generate deployment token
   gh secret set DOCS_DEPLOY_TOKEN --body "$YOUR_TOKEN"
   ```

3. **Add Workflow Files**
   ```bash
   mkdir -p .github/workflows
   cp examples/github-actions/*.yml .github/workflows/
   cp examples/github-actions/check-docs-sync.js .github/scripts/
   ```

4. **Configure MCP Server Path**
   Edit workflows to point to your MCP server installation:
   ```yaml
   MCP_SERVER_PATH: "/path/to/autonomous-docs-mcp/dist/index.js"
   ```

5. **Test Workflow**
   ```bash
   git add .github/
   git commit -m "Add docs automation workflows"
   git push
   ```

### Expected Output

- **On PR**: Validation comment with errors/warnings
- **On Merge**: Auto-generated documentation committed
- **On Release**: Deployed docs to GitHub Pages

---

## 2. Pre-commit Hook Integration

Validate documentation before committing to prevent broken docs.

### Files Structure

```
.git/hooks/
├── pre-commit
└── pre-commit.d/
    └── validate-docs.sh
scripts/
└── docs-autofix.js
```

### Complete Hook Files

See: [`examples/pre-commit/`](./pre-commit/)

- `pre-commit` - Main git hook entry point
- `validate-docs.sh` - Documentation validation script
- `docs-autofix.js` - Auto-fix common issues

### Setup Instructions

1. **Install Hook Manager (Optional)**
   ```bash
   npm install --save-dev husky
   npx husky install
   ```

2. **Copy Pre-commit Scripts**
   ```bash
   cp examples/pre-commit/pre-commit .git/hooks/
   chmod +x .git/hooks/pre-commit
   
   mkdir -p .git/hooks/pre-commit.d
   cp examples/pre-commit/validate-docs.sh .git/hooks/pre-commit.d/
   chmod +x .git/hooks/pre-commit.d/validate-docs.sh
   ```

3. **Configure Auto-fix**
   ```bash
   cp examples/pre-commit/docs-autofix.js scripts/
   npm install --save-dev @modelcontextprotocol/sdk
   ```

4. **Test Hook**
   ```bash
   # Make a change to docs
   echo "# Test" > docs/test.mdx
   git add docs/test.mdx
   git commit -m "Test pre-commit hook"
   ```

### Expected Output

```
Running pre-commit documentation checks...
[✓] Validating MDX syntax
[✓] Checking frontmatter
[✓] Validating internal links
[!] Found 2 issues - attempting auto-fix
[✓] Auto-fixed: Added missing frontmatter
[✓] All checks passed
```

---

## 3. Continuous Documentation Sync

Weekly automated sync to detect outdated docs with email notifications.

### Files Structure

```
scripts/
├── weekly-sync.sh
├── sync-checker.js
└── notify-slack.js
.github/workflows/
└── scheduled-sync.yml
cron/
└── docs-sync.cron
```

### Complete Sync Files

See: [`examples/continuous-sync/`](./continuous-sync/)

- `weekly-sync.sh` - Main sync orchestration script
- `sync-checker.js` - Detailed sync analysis
- `notify-slack.js` - Slack notification integration
- `scheduled-sync.yml` - GitHub Actions scheduler
- `docs-sync.cron` - Traditional cron configuration

### Setup Instructions

#### Option A: GitHub Actions (Recommended)

1. **Add Workflow**
   ```bash
   cp examples/continuous-sync/scheduled-sync.yml .github/workflows/
   ```

2. **Configure Slack Webhook**
   ```bash
   gh secret set SLACK_WEBHOOK_URL --body "$YOUR_WEBHOOK_URL"
   ```

3. **Customize Schedule**
   Edit `.github/workflows/scheduled-sync.yml`:
   ```yaml
   schedule:
     - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
   ```

#### Option B: Cron Job

1. **Install Scripts**
   ```bash
   cp examples/continuous-sync/*.sh scripts/
   cp examples/continuous-sync/*.js scripts/
   chmod +x scripts/weekly-sync.sh
   ```

2. **Configure Environment**
   ```bash
   cp examples/continuous-sync/.env.example .env
   # Edit .env with your settings
   ```

3. **Add Cron Entry**
   ```bash
   crontab -e
   # Add: 0 9 * * 1 /path/to/scripts/weekly-sync.sh
   ```

### Expected Output

**Console Output:**
```
[2025-11-02 09:00:00] Starting documentation sync check...
[2025-11-02 09:00:05] Analyzed 45 documentation files
[2025-11-02 09:00:10] Found 3 outdated files:
  - docs/api/endpoints.mdx (API changed 2 days ago)
  - docs/guides/setup.mdx (Referenced file moved)
  - docs/components/button.mdx (Props updated)
[2025-11-02 09:00:15] Sending notification to Slack
[2025-11-02 09:00:16] Sync report generated: reports/sync-2025-11-02.json
```

**Slack Notification:**
```
📚 Documentation Sync Report - Nov 2, 2025

Status: ⚠️ Attention Required

Outdated Files: 3
- api/endpoints.mdx (High Priority)
- guides/setup.mdx (Medium Priority)
- components/button.mdx (Low Priority)

View full report: [Link to GitHub Action]
```

---

## 4. Multi-Repo Documentation Aggregation

Aggregate documentation from multiple repositories into a unified documentation site.

### Files Structure

```
aggregator/
├── config.json
├── aggregate.js
├── repo-analyzer.js
└── cross-linker.js
docs-monorepo/
├── packages/
│   ├── service-a-docs/
│   ├── service-b-docs/
│   └── shared-components-docs/
└── docs.json
```

### Complete Aggregator Files

See: [`examples/multi-repo/`](./multi-repo/)

- `config.json` - Repository configuration
- `aggregate.js` - Main aggregation orchestrator
- `repo-analyzer.js` - Multi-repo analyzer
- `cross-linker.js` - Cross-repository link resolver
- `deploy.sh` - Aggregated docs deployment

### Setup Instructions

1. **Install Aggregator**
   ```bash
   mkdir docs-aggregator
   cd docs-aggregator
   npm init -y
   npm install @modelcontextprotocol/sdk glob fs-extra
   cp examples/multi-repo/*.js .
   cp examples/multi-repo/config.json .
   ```

2. **Configure Repositories**
   Edit `config.json`:
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
       "logo": "./assets/logo.svg"
     }
   }
   ```

3. **Set Up Authentication**
   ```bash
   export GITHUB_TOKEN="your_token"
   # Or use SSH keys for private repos
   ```

4. **Run Aggregation**
   ```bash
   node aggregate.js
   ```

5. **Deploy Aggregated Docs**
   ```bash
   cd aggregated-docs
   mintlify dev  # Preview locally
   ./deploy.sh   # Deploy to production
   ```

### Expected Output

```
Multi-Repository Documentation Aggregation
===========================================

Cloning repositories...
[✓] api-service (23 files)
[✓] web-app (18 files)
[✓] shared-components (34 files)

Analyzing documentation...
[✓] Extracted 75 total pages
[✓] Identified 145 API endpoints
[✓] Found 89 components

Cross-linking...
[✓] Resolved 34 cross-repo references
[✓] Updated 56 relative links

Generating unified navigation...
[✓] Created 5 top-level sections
[✓] Organized 75 pages

Building aggregated site...
[✓] Output: ./aggregated-docs
[✓] Ready for deployment

Preview: mintlify dev
Deploy: ./deploy.sh
```

---

## 5. Custom Theme Integration

Create and integrate a custom theme with brand colors, logos, and styling.

### Files Structure

```
themes/
├── custom-theme/
│   ├── theme.json
│   ├── colors.json
│   ├── fonts.json
│   └── components/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── CodeBlock.tsx
assets/
├── logo.svg
├── favicon.ico
└── og-image.png
```

### Complete Theme Files

See: [`examples/custom-theme/`](./custom-theme/)

- `theme.json` - Main theme configuration
- `colors.json` - Color palette
- `fonts.json` - Typography settings
- `components/` - Custom React components
- `apply-theme.js` - Theme application script

### Setup Instructions

1. **Create Theme Directory**
   ```bash
   mkdir -p themes/custom-theme/components
   cp examples/custom-theme/theme.json themes/custom-theme/
   cp examples/custom-theme/colors.json themes/custom-theme/
   cp examples/custom-theme/fonts.json themes/custom-theme/
   ```

2. **Customize Brand Colors**
   Edit `themes/custom-theme/colors.json`:
   ```json
   {
     "primary": "#0D9373",
     "primaryDark": "#0A7A5E",
     "primaryLight": "#10B891",
     "background": "#FFFFFF",
     "backgroundDark": "#0F172A",
     "text": "#1F2937",
     "textSecondary": "#6B7280",
     "accent": "#F59E0B",
     "error": "#EF4444",
     "success": "#10B981"
   }
   ```

3. **Add Brand Assets**
   ```bash
   mkdir -p assets
   cp your-logo.svg assets/logo.svg
   cp your-favicon.ico assets/favicon.ico
   cp your-og-image.png assets/og-image.png
   ```

4. **Apply Theme to Docs Config**
   ```bash
   node examples/custom-theme/apply-theme.js
   ```
   
   Or manually edit `docs/docs.json`:
   ```json
   {
     "name": "Your Project",
     "logo": {
       "light": "/assets/logo.svg",
       "dark": "/assets/logo-dark.svg"
     },
     "favicon": "/assets/favicon.ico",
     "colors": {
       "primary": "#0D9373",
       "light": "#10B891",
       "dark": "#0A7A5E"
     },
     "theme": "custom"
   }
   ```

5. **Test Theme**
   ```bash
   cd docs
   mintlify dev
   ```

### Expected Output

Your documentation site will now feature:
- Custom brand colors throughout
- Your logo in navigation
- Custom favicon
- Branded social sharing images
- Custom component styling

---

## 6. Mintlify Deployment Integration

Integrate with existing Mintlify setup and migrate from manual to automated docs.

### Files Structure

```
docs/
├── mint.json (existing)
├── migration/
│   ├── migrate.js
│   ├── preserve-manual.json
│   └── merge-strategy.json
└── .mintlify/
    ├── config.json
    └── deployment.yml
```

### Complete Migration Files

See: [`examples/mintlify-deploy/`](./mintlify-deploy/)

- `migrate.js` - Migration orchestrator
- `preserve-manual.json` - Manual docs to preserve
- `merge-strategy.json` - Auto vs manual merge rules
- `deployment.yml` - Mintlify deployment config
- `hybrid-workflow.js` - Hybrid manual/auto workflow

### Setup Instructions

#### Step 1: Backup Existing Docs

```bash
mkdir docs-backup
cp -r docs/* docs-backup/
```

#### Step 2: Analyze Current Documentation

```bash
node examples/mintlify-deploy/analyze-existing.js docs
```

Output will identify:
- Manual pages to preserve
- Pages that can be auto-generated
- Outdated content
- Missing documentation

#### Step 3: Configure Preservation Rules

Edit `migration/preserve-manual.json`:
```json
{
  "preserve": [
    "introduction.mdx",
    "guides/getting-started.mdx",
    "guides/best-practices.mdx"
  ],
  "autoGenerate": [
    "api/**/*.mdx",
    "components/**/*.mdx"
  ],
  "hybrid": [
    {
      "file": "guides/advanced.mdx",
      "sections": {
        "manual": ["Introduction", "Prerequisites"],
        "auto": ["API Reference", "Code Examples"]
      }
    }
  ]
}
```

#### Step 4: Run Migration

```bash
cd docs
node ../examples/mintlify-deploy/migrate.js
```

#### Step 5: Set Up Hybrid Workflow

```bash
# Install workflow script
cp examples/mintlify-deploy/hybrid-workflow.js scripts/

# Add to package.json
npm pkg set scripts.docs:sync="node scripts/hybrid-workflow.js"
npm pkg set scripts.docs:generate="node scripts/hybrid-workflow.js --generate"
npm pkg set scripts.docs:validate="node scripts/hybrid-workflow.js --validate"
```

#### Step 6: Configure Mintlify Deployment

```bash
# Link to Mintlify
mintlify login
mintlify init

# Deploy
mintlify deploy
```

### Expected Output

**Migration Summary:**
```
Mintlify Documentation Migration
=================================

Analysis Complete:
- Total pages: 45
- Manual pages: 12 (preserved)
- Auto-generated: 28 (new)
- Hybrid pages: 5 (merged)

Actions Taken:
[✓] Backed up existing docs
[✓] Preserved 12 manual pages
[✓] Generated 28 new pages
[✓] Merged 5 hybrid pages
[✓] Updated navigation structure
[✓] Migrated custom components
[✓] Preserved theme settings

Next Steps:
1. Review merged content: docs/migration/review/
2. Test locally: mintlify dev
3. Deploy: mintlify deploy

Hybrid Workflow Available:
- npm run docs:sync     (sync with code)
- npm run docs:generate (regenerate auto docs)
- npm run docs:validate (validate all docs)
```

---

## 7. API Documentation Plugin

Extend autonomous-docs-mcp with custom API parser for new languages or frameworks.

### Files Structure

```
plugins/
└── api-parsers/
    ├── rust-parser.ts
    ├── graphql-parser.ts
    └── custom-framework-parser.ts
src/
└── plugins/
    ├── plugin-interface.ts
    └── plugin-loader.ts
examples/
└── api-plugin/
    ├── example-parser.ts
    ├── formatter.ts
    └── README.md
```

### Complete Plugin Files

See: [`examples/api-plugin/`](./api-plugin/)

- `plugin-interface.ts` - Plugin interface definition
- `example-parser.ts` - Example custom parser (Rust)
- `graphql-parser.ts` - GraphQL schema parser
- `formatter.ts` - Custom output formatters
- `plugin-loader.ts` - Dynamic plugin loader

### Creating a Custom Parser

#### Step 1: Define Parser Interface

```typescript
// src/plugins/plugin-interface.ts
export interface APIParser {
  name: string;
  version: string;
  supportedExtensions: string[];
  parse(filePath: string, content: string): Promise<ParsedAPI[]>;
  format(api: ParsedAPI, format: string): string;
}

export interface ParsedAPI {
  name: string;
  type: 'function' | 'class' | 'endpoint' | 'type';
  signature: string;
  documentation?: string;
  parameters?: Parameter[];
  returns?: TypeInfo;
  examples?: string[];
  metadata?: Record<string, any>;
}
```

#### Step 2: Implement Custom Parser

```typescript
// plugins/api-parsers/rust-parser.ts
import { APIParser, ParsedAPI } from '../../src/plugins/plugin-interface';
import * as fs from 'fs-extra';

export class RustAPIParser implements APIParser {
  name = 'rust-api-parser';
  version = '1.0.0';
  supportedExtensions = ['.rs'];

  async parse(filePath: string, content: string): Promise<ParsedAPI[]> {
    const apis: ParsedAPI[] = [];
    
    // Parse Rust doc comments and function signatures
    const functionRegex = /\/\/\/\s*(.*?)\n.*?pub\s+fn\s+(\w+)\s*\((.*?)\)\s*->\s*(.*?)\s*\{/gs;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const [_, doc, name, params, returnType] = match;
      
      apis.push({
        name,
        type: 'function',
        signature: `fn ${name}(${params}) -> ${returnType}`,
        documentation: doc.trim(),
        parameters: this.parseParameters(params),
        returns: { type: returnType.trim(), description: '' }
      });
    }
    
    return apis;
  }

  private parseParameters(paramsStr: string): Parameter[] {
    // Parse Rust parameters
    return paramsStr.split(',').map(p => {
      const [name, type] = p.trim().split(':').map(s => s.trim());
      return { name, type, required: true };
    });
  }

  format(api: ParsedAPI, format: string): string {
    if (format === 'mintlify') {
      return this.formatMintlify(api);
    }
    return JSON.stringify(api, null, 2);
  }

  private formatMintlify(api: ParsedAPI): string {
    return `---
title: "${api.name}"
description: "${api.documentation || ''}"
---

## Signature

\`\`\`rust
${api.signature}
\`\`\`

## Parameters

${api.parameters?.map(p => `- **${p.name}** (\`${p.type}\`): ${p.description || ''}`).join('\n') || 'None'}

## Returns

${api.returns ? `\`${api.returns.type}\`: ${api.returns.description}` : 'None'}
`;
  }
}
```

#### Step 3: Register Plugin

```typescript
// src/plugins/plugin-loader.ts
import { APIParser } from './plugin-interface';
import * as path from 'path';
import * as fs from 'fs-extra';

export class PluginLoader {
  private parsers: Map<string, APIParser> = new Map();

  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    const parser = new plugin.default() as APIParser;
    
    for (const ext of parser.supportedExtensions) {
      this.parsers.set(ext, parser);
    }
    
    console.log(`Loaded plugin: ${parser.name} v${parser.version}`);
  }

  async loadAllPlugins(pluginDir: string): Promise<void> {
    const files = await fs.readdir(pluginDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        await this.loadPlugin(path.join(pluginDir, file));
      }
    }
  }

  getParser(extension: string): APIParser | undefined {
    return this.parsers.get(extension);
  }
}
```

#### Step 4: Integrate with MCP Server

```typescript
// Add to src/index.ts
import { PluginLoader } from './plugins/plugin-loader';

const pluginLoader = new PluginLoader();
await pluginLoader.loadAllPlugins('./plugins/api-parsers');

// Modify generate_api_reference handler
case "generate_api_reference": {
  const ext = path.extname(args.source_path as string);
  const parser = pluginLoader.getParser(ext);
  
  if (parser) {
    // Use custom parser
    const files = await glob(`**/*${ext}`, { cwd: args.source_path });
    const allAPIs = [];
    
    for (const file of files) {
      const content = await fs.readFile(path.join(args.source_path, file), 'utf-8');
      const apis = await parser.parse(file, content);
      allAPIs.push(...apis);
    }
    
    // Generate documentation
    for (const api of allAPIs) {
      const formatted = parser.format(api, args.format || 'mintlify');
      await fs.writeFile(
        path.join(args.output_path || './docs/api', `${api.name}.mdx`),
        formatted
      );
    }
  }
}
```

### Setup Instructions

1. **Install Plugin Development Dependencies**
   ```bash
   npm install --save-dev @types/node typescript
   ```

2. **Copy Example Plugin**
   ```bash
   mkdir -p plugins/api-parsers
   cp examples/api-plugin/example-parser.ts plugins/api-parsers/rust-parser.ts
   ```

3. **Customize for Your Framework**
   Edit `plugins/api-parsers/rust-parser.ts` to match your language/framework

4. **Build Plugin**
   ```bash
   npm run build
   ```

5. **Test Plugin**
   ```bash
   # Create test file
   cat > test.rs << 'RUST'
   /// Returns the sum of two numbers
   /// 
   /// # Examples
   /// ```
   /// let result = add(2, 3);
   /// assert_eq!(result, 5);
   /// ```
   pub fn add(a: i32, b: i32) -> i32 {
       a + b
   }
   RUST

   # Test parser
   node test-plugin.js
   ```

### Expected Output

**Plugin Registration:**
```
Loading API documentation plugins...
[✓] Loaded plugin: rust-api-parser v1.0.0
    Supports: .rs
[✓] Loaded plugin: graphql-parser v1.0.0
    Supports: .graphql, .gql
[✓] Loaded plugin: custom-framework-parser v1.0.0
    Supports: .custom
```

**Generated Documentation:**
```mdx
---
title: "add"
description: "Returns the sum of two numbers"
---

## Signature

\`\`\`rust
fn add(a: i32, b: i32) -> i32
\`\`\`

## Parameters

- **a** (`i32`): First number to add
- **b** (`i32`): Second number to add

## Returns

`i32`: Sum of the two numbers

## Examples

\`\`\`rust
let result = add(2, 3);
assert_eq!(result, 5);
\`\`\`
```

---

## Testing Integration Examples

### Test Suite

Each integration example includes tests:

```bash
# Test all integrations
npm run test:integrations

# Test specific integration
npm run test:integration -- github-actions
npm run test:integration -- pre-commit
```

### Manual Testing Checklist

- [ ] GitHub Actions workflows trigger correctly
- [ ] Pre-commit hooks prevent bad commits
- [ ] Scheduled sync sends notifications
- [ ] Multi-repo aggregation resolves cross-links
- [ ] Custom theme applies to all pages
- [ ] Mintlify migration preserves manual content
- [ ] Custom API parser generates valid docs

---

## Troubleshooting

### Common Issues

**GitHub Actions not triggering:**
```bash
# Check workflow syntax
actionlint .github/workflows/*.yml

# Check workflow permissions
# Settings > Actions > General > Workflow permissions
```

**Pre-commit hook not running:**
```bash
# Ensure executable
chmod +x .git/hooks/pre-commit

# Test manually
.git/hooks/pre-commit
```

**MCP server not found:**
```bash
# Verify installation
ls -la /path/to/autonomous-docs-mcp/dist/index.js

# Test server
node /path/to/autonomous-docs-mcp/dist/index.js
```

**Plugin not loading:**
```bash
# Check plugin syntax
npx tsc --noEmit plugins/api-parsers/your-parser.ts

# Verify plugin interface
# Must implement APIParser interface
```

---

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Mintlify Documentation](https://mintlify.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)

---

## Support

For issues with integration examples:
1. Check the example README in each directory
2. Review error logs
3. Open an issue on GitHub with reproduction steps

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0
