# Best Practices

Comprehensive guide to using autonomous-docs-mcp effectively in production environments.

## Table of Contents

- [Documentation Maintenance Schedules](#documentation-maintenance-schedules)
- [Security Considerations](#security-considerations)
- [Performance Tuning](#performance-tuning)
- [Team Collaboration Workflows](#team-collaboration-workflows)
- [Version Management](#version-management)
- [Quality Assurance](#quality-assurance)

## Documentation Maintenance Schedules

### Recommended Sync Frequencies

Choose the right sync frequency based on your project's needs:

| Project Type | Sync Frequency | Automation Level | Rationale |
|-------------|----------------|------------------|-----------|
| Active Development | Continuous (watch mode) | High | Catch changes immediately |
| Stable Library | Daily | Medium | Balance freshness with overhead |
| Internal Tool | Weekly | Low | Reduce CI/CD load |
| Legacy System | Monthly | Minimal | Documentation rarely changes |

**Implementation:**

```yaml
# Daily sync for active projects
schedule:
  - cron: '0 2 * * *'  # 2 AM UTC daily

# Weekly sync for stable projects
schedule:
  - cron: '0 2 * * 0'  # 2 AM UTC every Sunday

# Monthly sync for legacy
schedule:
  - cron: '0 2 1 * *'  # 2 AM UTC on 1st of month
```

### Version Control Strategies

**Do's:**

- Commit generated documentation alongside source code
- Use semantic commit messages: `docs: update API reference for v2.0`
- Tag documentation versions with source code releases
- Keep documentation in the same repository as source (when possible)

**Don'ts:**

- Don't gitignore the entire docs/ directory
- Avoid manually editing generated documentation files
- Never commit without validation
- Don't mix manual and generated docs in same files

**Recommended .gitignore patterns:**

```gitignore
# Ignore temporary analysis files
.docs-analysis.json
/tmp-docs/
*.docs.tmp

# Keep generated documentation
# (don't ignore docs/ directory)

# Ignore local dev files
.docs-cache/
docs-dev/
```

### Documentation Review Workflows

**Weekly Review Checklist:**

- [ ] Run full documentation validation
- [ ] Check for broken links (internal and external)
- [ ] Verify all code examples are current
- [ ] Review documentation needs suggestions
- [ ] Update changelog
- [ ] Check analytics for popular/missing pages

**Monthly Audit:**

```bash
#!/bin/bash
# scripts/monthly-audit.sh

echo "Monthly Documentation Audit"
echo "============================"

# 1. Full analysis
echo "1. Analyzing codebase..."
claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > audit-analysis.json

# 2. Check sync status
echo "2. Checking sync status..."
claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src" > sync-status.json

OUTDATED=$(jq -r '.outdated | length' sync-status.json)
echo "   Outdated files: $OUTDATED"

# 3. Validate everything
echo "3. Validating documentation..."
claude "Use autonomous-docs validate_documentation with docs_path ./docs, strict true" > validation.json

ERRORS=$(jq -r '.summary.total_errors' validation.json)
WARNINGS=$(jq -r '.summary.total_warnings' validation.json)

echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"

# 4. Generate report
cat > audit-report.md << EOF
# Documentation Audit Report
**Date:** $(date +%Y-%m-%d)

## Summary
- Outdated files: $OUTDATED
- Validation errors: $ERRORS
- Validation warnings: $WARNINGS

## Action Items
$(jq -r '.outdated[] | "- [ ] Update: \(.)"' sync-status.json)

## Errors
$(jq -r '.errors[] | "- \(.file): \(.message)"' validation.json)
EOF

echo "4. Report generated: audit-report.md"
```

### Deprecation Handling

**Marking Deprecated APIs:**

```mdx
---
title: "Legacy Authentication API"
deprecated: true
deprecationMessage: "This API is deprecated. Use OAuth2 instead."
deprecationDate: "2024-12-31"
replacement: "/api/oauth2"
---

<Warning>
This API is deprecated and will be removed on December 31, 2024.
Please migrate to [OAuth2 Authentication](/api/oauth2).
</Warning>

# Legacy Authentication API

...
```

**Automated Deprecation Notices:**

```javascript
// scripts/add-deprecation-notices.js
const fs = require('fs-extra');
const matter = require('gray-matter');

async function addDeprecationNotice(filePath, config) {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = matter(content);

  parsed.data.deprecated = true;
  parsed.data.deprecationMessage = config.message;
  parsed.data.deprecationDate = config.date;
  parsed.data.replacement = config.replacement;

  const updated = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(filePath, updated);
}

// Usage
const deprecations = [
  {
    file: 'docs/api/legacy-auth.mdx',
    message: 'Use OAuth2 instead',
    date: '2024-12-31',
    replacement: '/api/oauth2'
  }
];

deprecations.forEach(d => addDeprecationNotice(d.file, d));
```

## Security Considerations

### Protecting Sensitive Information

**Critical: Never expose in documentation:**

- API keys, tokens, secrets
- Database credentials
- Internal IP addresses/hostnames
- Private algorithm details
- Security vulnerabilities (unpatched)
- User data or PII

**Pre-generation security scan:**

```bash
#!/bin/bash
# scripts/security-scan-docs.sh

echo "Scanning documentation for sensitive data..."

# Patterns to detect
PATTERNS=(
  "sk-[a-zA-Z0-9]{40}"           # API keys
  "[a-zA-Z0-9]{32}"              # Potential secrets
  "password\s*=\s*['\"][^'\"]+['\"]"  # Hardcoded passwords
  "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"  # IP addresses
  "mongodb://[^@]+:[^@]+@"        # DB connection strings
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  if grep -r -E "$pattern" docs/; then
    echo "⚠️  Found potential sensitive data: $pattern"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "❌ Security scan failed - review findings above"
  exit 1
else
  echo "✅ Security scan passed"
fi
```

**Sanitization configuration:**

```json
{
  "generation": {
    "sanitize": true,
    "redact_patterns": [
      "sk-[a-zA-Z0-9]{40}",
      "ghp_[a-zA-Z0-9]{36}",
      "mongodb://.*@"
    ],
    "placeholder_text": "[REDACTED]",
    "exclude_private_apis": true
  }
}
```

### Access Control for Documentation

**Public vs Private Documentation:**

```yaml
# docs.json
{
  "name": "My Project",
  "navigation": [
    {
      "group": "Public API",
      "pages": ["api/public/overview"]
    },
    {
      "group": "Internal API",
      "pages": ["api/internal/overview"],
      "access": "private"
    }
  ],
  "authentication": {
    "enabled": true,
    "provider": "oauth2",
    "allowedDomains": ["company.com"]
  }
}
```

**GitHub Pages with authentication:**

```yaml
# .github/workflows/deploy-secure-docs.yml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Vercel with auth
      run: |
        vercel deploy --prod \
          --env ENABLE_AUTH=true \
          --env AUTH_PROVIDER=github \
          --env ALLOWED_ORGS=your-org
```

### Safe Handling of Code Examples

**Sanitize code examples:**

```javascript
// scripts/sanitize-examples.js
const fs = require('fs-extra');
const path = require('path');

const REPLACEMENTS = {
  // Replace actual values with placeholders
  'sk-[a-zA-Z0-9]{40}': 'YOUR_API_KEY',
  'mongodb://.*@': 'mongodb://username:password@hostname:port/database',
  'postgres://.*@': 'postgres://username:password@hostname:port/database',
  'https://.*\\.amazonaws\\.com': 'https://your-bucket.s3.amazonaws.com'
};

async function sanitizeFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');

  for (const [pattern, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(pattern, 'g');
    content = content.replace(regex, replacement);
  }

  await fs.writeFile(filePath, content);
}

// Process all MDX files
const files = await glob('docs/**/*.mdx');
await Promise.all(files.map(sanitizeFile));
```

**Example placeholders:**

```typescript
// ✅ Good - uses placeholders
const client = new ApiClient({
  apiKey: process.env.API_KEY || 'YOUR_API_KEY',
  endpoint: 'https://api.example.com'
});

// ❌ Bad - exposes actual credentials
const client = new ApiClient({
  apiKey: 'sk-1234567890abcdef',
  endpoint: 'https://internal.company.com'
});
```

### Credential Management in CI/CD

**GitHub Actions secrets:**

```yaml
# .github/workflows/docs.yml
env:
  CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
  MINTLIFY_API_KEY: ${{ secrets.MINTLIFY_API_KEY }}

steps:
  - name: Generate documentation
    run: |
      # Never log secrets
      set +x
      claude "Use autonomous-docs analyze_codebase..." > /dev/null
    env:
      ANTHROPIC_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

**Vault integration:**

```bash
#!/bin/bash
# scripts/deploy-with-vault.sh

# Fetch secrets from Vault
export CLAUDE_API_KEY=$(vault kv get -field=api_key secret/claude)
export MINTLIFY_KEY=$(vault kv get -field=api_key secret/mintlify)

# Use in documentation generation
claude "Use autonomous-docs generate_documentation..."

# Unset after use
unset CLAUDE_API_KEY MINTLIFY_KEY
```

## Performance Tuning

### Optimizing Analysis Depth

**Choose the right depth for your needs:**

```javascript
// Quick scan (< 1 minute) - PR validation
{
  depth: 'quick',
  include_patterns: ['src/**/*.ts'],
  // Only scans changed files
}

// Standard scan (2-5 minutes) - daily sync
{
  depth: 'standard',
  exclude_patterns: ['tests/**', 'examples/**'],
  // Balances coverage with speed
}

// Comprehensive scan (10-30 minutes) - release documentation
{
  depth: 'comprehensive',
  include_patterns: ['**/*'],
  // Full codebase analysis
}
```

**Progressive analysis strategy:**

```bash
#!/bin/bash
# scripts/progressive-analysis.sh

# Quick analysis first
echo "Quick analysis..."
claude "Use autonomous-docs analyze_codebase with path ., depth quick" > quick-analysis.json

# Check if full analysis is needed
NEEDS_FULL=$(jq -r '.documentation_needs | length' quick-analysis.json)

if [ "$NEEDS_FULL" -gt 10 ]; then
  echo "Many docs needed, running comprehensive analysis..."
  claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > full-analysis.json
  ANALYSIS_FILE="full-analysis.json"
else
  echo "Using quick analysis"
  ANALYSIS_FILE="quick-analysis.json"
fi

# Generate with appropriate analysis
claude "Use autonomous-docs generate_documentation with analysis_result $(cat $ANALYSIS_FILE), output_dir ./docs"
```

### Caching Strategies

**File-level caching:**

```javascript
// scripts/cached-generation.js
const crypto = require('crypto');
const fs = require('fs-extra');

const CACHE_DIR = '.docs-cache';

function getCacheKey(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function generateWithCache(sourceFile, outputFile) {
  const cacheKey = getCacheKey(sourceFile);
  const cachePath = `${CACHE_DIR}/${cacheKey}.json`;

  // Check cache
  if (await fs.pathExists(cachePath)) {
    console.log(`Cache hit for ${sourceFile}`);
    const cached = await fs.readJson(cachePath);
    await fs.writeFile(outputFile, cached.content);
    return;
  }

  // Generate
  console.log(`Generating ${sourceFile}...`);
  const result = await generateDocumentation(sourceFile);

  // Cache result
  await fs.ensureDir(CACHE_DIR);
  await fs.writeJson(cachePath, {
    timestamp: Date.now(),
    content: result
  });

  await fs.writeFile(outputFile, result);
}
```

**Redis caching for large projects:**

```javascript
// scripts/redis-cache.js
const Redis = require('redis');
const redis = Redis.createClient();

async function getOrGenerate(key, generator) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Generate
  const result = await generator();

  // Cache for 24 hours
  await redis.setex(key, 86400, JSON.stringify(result));

  return result;
}

// Usage
const analysis = await getOrGenerate(
  `analysis:${projectPath}`,
  () => analyzeCodebase(projectPath)
);
```

### Incremental Generation Techniques

**File change detection:**

```bash
#!/bin/bash
# scripts/incremental-docs.sh

# Get changed files since last doc generation
LAST_GEN=$(cat .last-doc-generation 2>/dev/null || echo "HEAD~1")
CHANGED=$(git diff --name-only $LAST_GEN HEAD -- src/)

if [ -z "$CHANGED" ]; then
  echo "No changes detected"
  exit 0
fi

echo "Changed files:"
echo "$CHANGED"

# Generate docs only for changed files
echo "$CHANGED" | while read file; do
  echo "Updating docs for $file..."
  # Generate API reference for this file
  claude "Use autonomous-docs generate_api_reference with source_path $file"
done

# Update timestamp
git rev-parse HEAD > .last-doc-generation
```

**Smart dependency tracking:**

```javascript
// scripts/smart-regen.js
const dependencyTree = require('dependency-tree');

function getAffectedDocs(changedFile) {
  // Find all files that import this file
  const tree = dependencyTree.toList({
    filename: changedFile,
    directory: './src'
  });

  // Map to documentation files
  return tree.map(file => {
    const relPath = file.replace(/^src\//, '');
    return `docs/api/${relPath}.mdx`;
  });
}

// Regenerate only affected docs
const changedFiles = getChangedFiles();
const affectedDocs = changedFiles.flatMap(getAffectedDocs);

for (const docFile of [...new Set(affectedDocs)]) {
  await regenerateDoc(docFile);
}
```

### Resource Management for CI/CD

**Parallel processing with limits:**

```javascript
// scripts/parallel-generation.js
const pLimit = require('p-limit');

// Limit to 4 concurrent generations
const limit = pLimit(4);

const files = await getSourceFiles();

const results = await Promise.all(
  files.map(file =>
    limit(() => generateDocForFile(file))
  )
);
```

**Memory-efficient processing:**

```javascript
// scripts/stream-generation.js
const { pipeline } = require('stream/promises');

async function generateLargeProject() {
  // Process files in streams to avoid memory issues
  await pipeline(
    createFileStream('./src'),
    analyzeStream(),
    generateDocsStream(),
    writeDocsStream('./docs')
  );
}
```

## Team Collaboration Workflows

### Multi-contributor Documentation Processes

**Branch strategy:**

```
main (protected)
  ├── develop (integration branch)
  │   ├── feature/new-api (contributor A)
  │   └── feature/update-guides (contributor B)
  └── docs/release-prep (technical writer)
```

**Pull request template:**

```markdown
## Documentation Checklist

- [ ] Documentation generated with latest autonomous-docs-mcp
- [ ] All validation checks pass
- [ ] Code examples tested and work
- [ ] Links verified (internal and external)
- [ ] Frontmatter complete (title, description)
- [ ] Screenshots/diagrams included (if applicable)
- [ ] Changelog updated

## Documentation Changes

### New Pages
- List new documentation pages

### Updated Pages
- List updated pages with reason

### Removed Pages
- List removed pages with reason

## Verification Commands

```bash
# Run these locally before submitting PR
npm run docs:validate
npm run docs:test-examples
npm run docs:check-links
```

**Generated with:** `autonomous-docs-mcp v1.0.0`
```

### Documentation Ownership Models

**CODEOWNERS for documentation:**

```
# .github/CODEOWNERS

# API documentation requires engineering review
/docs/api/**       @engineering-team

# Guides require technical writing review
/docs/guides/**    @tech-writers

# Examples require QA verification
/docs/examples/**  @qa-team

# All docs need docs team approval
/docs/**           @docs-team
```

**Ownership manifest:**

```json
{
  "documentation_ownership": {
    "api": {
      "primary": "@engineering-team",
      "reviewers": ["@api-guild", "@security-team"],
      "auto_assign": true
    },
    "guides": {
      "primary": "@tech-writers",
      "reviewers": ["@engineering-team"],
      "auto_assign": true
    },
    "components": {
      "primary": "@frontend-team",
      "reviewers": ["@design-system-team"],
      "auto_assign": true
    }
  }
}
```

### Review and Approval Workflows

**Automated review assignment:**

```yaml
# .github/workflows/assign-reviewers.yml
name: Assign Documentation Reviewers

on:
  pull_request:
    paths:
      - 'docs/**'

jobs:
  assign:
    runs-on: ubuntu-latest
    steps:
      - name: Assign reviewers based on files
        uses: actions/github-script@v7
        with:
          script: |
            const files = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const reviewers = new Set();

            files.data.forEach(file => {
              if (file.filename.startsWith('docs/api/')) {
                reviewers.add('engineering-team');
              }
              if (file.filename.startsWith('docs/guides/')) {
                reviewers.add('tech-writers');
              }
            });

            if (reviewers.size > 0) {
              await github.rest.pulls.requestReviewers({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.issue.number,
                team_reviewers: Array.from(reviewers)
              });
            }
```

**Review checklist automation:**

```javascript
// scripts/create-review-checklist.js
const { Octokit } = require('@octokit/rest');

async function createReviewChecklist(prNumber) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const checklist = `
## Documentation Review Checklist

### Content Quality
- [ ] Information is accurate and up-to-date
- [ ] Explanations are clear and concise
- [ ] Examples are practical and tested
- [ ] No sensitive information exposed

### Technical Accuracy
- [ ] API signatures match source code
- [ ] Code examples compile/run successfully
- [ ] Parameter types are correct
- [ ] Return values documented accurately

### Structure
- [ ] Follows documentation style guide
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Frontmatter complete
- [ ] Navigation updated

### Links & References
- [ ] All internal links work
- [ ] External links are valid
- [ ] Cross-references appropriate
- [ ] Related docs linked

### Accessibility
- [ ] Images have alt text
- [ ] Code blocks have language tags
- [ ] Headings form logical outline
- [ ] No broken formatting
  `;

  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body: checklist
  });
}
```

### Style Guide Enforcement

**Automated style checks:**

```javascript
// scripts/enforce-style.js
const fs = require('fs-extra');
const matter = require('gray-matter');

const STYLE_RULES = {
  maxHeadingDepth: 4,
  maxLineLength: 120,
  requiredFrontmatter: ['title', 'description'],
  forbiddenWords: ['simply', 'just', 'obviously'],
  codeBlockLanguageRequired: true
};

function checkStyle(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(content);
  const errors = [];

  // Check frontmatter
  STYLE_RULES.requiredFrontmatter.forEach(field => {
    if (!parsed.data[field]) {
      errors.push(`Missing required frontmatter: ${field}`);
    }
  });

  // Check forbidden words
  STYLE_RULES.forbiddenWords.forEach(word => {
    if (parsed.content.toLowerCase().includes(word)) {
      errors.push(`Avoid using word: "${word}"`);
    }
  });

  // Check heading depth
  const headingMatches = parsed.content.match(/^#{1,6} /gm);
  if (headingMatches) {
    const maxDepth = Math.max(...headingMatches.map(h => h.split(' ')[0].length));
    if (maxDepth > STYLE_RULES.maxHeadingDepth) {
      errors.push(`Heading too deep: H${maxDepth} (max: H${STYLE_RULES.maxHeadingDepth})`);
    }
  }

  // Check code blocks have language
  if (STYLE_RULES.codeBlockLanguageRequired) {
    if (/```\n/.test(parsed.content)) {
      errors.push('Code block missing language specifier');
    }
  }

  return errors;
}
```

## Version Management

### Documentation Versioning Strategies

**Version-specific documentation:**

```
docs/
├── v1.0/
│   ├── introduction.mdx
│   └── api/
├── v2.0/
│   ├── introduction.mdx
│   └── api/
├── v2.1/  (latest)
│   ├── introduction.mdx
│   └── api/
└── docs.json
```

**Version switcher configuration:**

```json
{
  "name": "My Project",
  "versions": [
    {
      "name": "v2.1 (latest)",
      "path": "/v2.1",
      "default": true
    },
    {
      "name": "v2.0",
      "path": "/v2.0"
    },
    {
      "name": "v1.0",
      "path": "/v1.0",
      "deprecated": true
    }
  ]
}
```

**Automated version generation:**

```bash
#!/bin/bash
# scripts/generate-versioned-docs.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

echo "Generating documentation for version $VERSION..."

# Create version directory
mkdir -p docs/$VERSION

# Analyze codebase at specific tag
git checkout tags/$VERSION
claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > analysis-$VERSION.json

# Generate documentation
claude "Use autonomous-docs generate_documentation with analysis_result $(cat analysis-$VERSION.json), output_dir docs/$VERSION"

# Return to main branch
git checkout main

echo "✅ Documentation for $VERSION generated in docs/$VERSION"
```

### Managing Docs Across Software Versions

**Parallel version maintenance:**

```yaml
# .github/workflows/maintain-versions.yml
name: Maintain Documentation Versions

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  update-all-versions:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        version: [v1.0, v2.0, v2.1]

    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ matrix.version }}

      - name: Generate docs for ${{ matrix.version }}
        run: |
          claude "Use autonomous-docs analyze_codebase..." > analysis.json
          claude "Use autonomous-docs generate_documentation with analysis_result $(cat analysis.json), output_dir docs/${{ matrix.version }}"

      - name: Commit changes
        run: |
          git add docs/${{ matrix.version }}
          git commit -m "docs: update ${{ matrix.version }} documentation"
          git push
```

### Migration Guides Between Versions

**Auto-generate migration guides:**

```javascript
// scripts/generate-migration-guide.js
async function generateMigrationGuide(fromVersion, toVersion) {
  // Analyze both versions
  const oldAnalysis = await analyzeVersion(fromVersion);
  const newAnalysis = await analyzeVersion(toVersion);

  // Find differences
  const breaking = findBreakingChanges(oldAnalysis.apis, newAnalysis.apis);
  const deprecated = findDeprecated(oldAnalysis.apis, newAnalysis.apis);
  const new_features = findNewFeatures(oldAnalysis.apis, newAnalysis.apis);

  // Generate migration guide
  const guide = `
# Migration Guide: ${fromVersion} → ${toVersion}

## Breaking Changes

${breaking.map(change => `
### ${change.name}

**Before (${fromVersion}):**
\`\`\`typescript
${change.old_signature}
\`\`\`

**After (${toVersion}):**
\`\`\`typescript
${change.new_signature}
\`\`\`

**Migration:**
${change.migration_steps}
`).join('\n')}

## Deprecated APIs

${deprecated.map(api => `
- \`${api.name}\`: ${api.deprecation_message}
  - Replacement: \`${api.replacement}\`
`).join('\n')}

## New Features

${new_features.map(feature => `
### ${feature.name}

${feature.description}

\`\`\`typescript
${feature.example}
\`\`\`
`).join('\n')}
  `;

  await fs.writeFile(
    `docs/migration-${fromVersion}-to-${toVersion}.mdx`,
    guide
  );
}
```

### Deprecation Notices

**Deprecation workflow:**

```javascript
// scripts/deprecation-workflow.js

// 1. Mark API as deprecated in code
/**
 * @deprecated Use newApi() instead. Will be removed in v3.0.
 */
function oldApi() {
  console.warn('oldApi() is deprecated');
}

// 2. Update documentation
const deprecationNotice = {
  api: 'oldApi',
  version: 'v2.5',
  removalVersion: 'v3.0',
  replacement: 'newApi',
  reason: 'Better performance and error handling'
};

// 3. Generate deprecation page
await generateDeprecationNotice(deprecationNotice);

// 4. Add to changelog
await addToChangelog('DEPRECATED', deprecationNotice);

// 5. Create GitHub issue for removal
await createRemovalIssue(deprecationNotice);
```

## Quality Assurance

### Documentation Testing Strategies

**Test code examples:**

```javascript
// scripts/test-examples.js
const { execSync } = require('child_process');
const fs = require('fs-extra');

async function testCodeExamples() {
  const mdxFiles = await glob('docs/**/*.mdx');

  for (const file of mdxFiles) {
    const content = await fs.readFile(file, 'utf-8');

    // Extract code blocks
    const codeBlocks = extractCodeBlocks(content);

    for (const block of codeBlocks) {
      if (block.language === 'typescript' && block.runnable) {
        try {
          // Write to temp file and compile
          await fs.writeFile('/tmp/test.ts', block.code);
          execSync('tsc --noEmit /tmp/test.ts');
          console.log(`✅ ${file}: Code example valid`);
        } catch (error) {
          console.error(`❌ ${file}: Code example has errors`);
          console.error(error.message);
        }
      }
    }
  }
}
```

**Automated link checking:**

```bash
#!/bin/bash
# scripts/check-all-links.sh

echo "Checking all documentation links..."

# Use markdown-link-check
npx markdown-link-check docs/**/*.md \
  --config .markdown-link-check.json \
  --quiet

# Use broken-link-checker for full site
if [ -n "$DOCS_URL" ]; then
  npx broken-link-checker $DOCS_URL \
    --recursive \
    --ordered \
    --exclude-external
fi
```

### Validation Checkpoints

**Multi-stage validation:**

```yaml
# .github/workflows/validate-docs.yml
name: Documentation Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Stage 1: Structure validation
      - name: Validate structure
        run: |
          claude "Use autonomous-docs validate_documentation with docs_path ./docs, check_links false, check_code_examples false"

      # Stage 2: Link validation
      - name: Validate links
        run: |
          claude "Use autonomous-docs validate_documentation with docs_path ./docs, check_links true"

      # Stage 3: Code example validation
      - name: Validate code examples
        run: npm run test:examples

      # Stage 4: Accessibility check
      - name: Check accessibility
        run: npm run a11y:check

      # Stage 5: Performance check
      - name: Check performance
        run: npm run lighthouse:check
```

### Metrics and Monitoring

**Documentation analytics:**

```javascript
// scripts/generate-analytics-report.js
const { google } = require('googleapis');

async function generateAnalyticsReport() {
  const analytics = google.analyticsdata('v1beta');

  const response = await analytics.properties.runReport({
    property: 'properties/123456',
    requestBody: {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ]
    }
  });

  // Identify documentation gaps
  const lowTraffic = response.data.rows
    .filter(row => row.metricValues[0].value < 10)
    .map(row => row.dimensionValues[0].value);

  console.log('Low-traffic pages (may need improvement):');
  lowTraffic.forEach(page => console.log(`  - ${page}`));

  // Generate report
  await fs.writeJson('analytics-report.json', {
    timestamp: new Date().toISOString(),
    lowTrafficPages: lowTraffic,
    topPages: response.data.rows.slice(0, 10)
  });
}
```

**Health monitoring:**

```bash
#!/bin/bash
# scripts/docs-health-check.sh

echo "Documentation Health Check"
echo "=========================="

# 1. Check completeness
TOTAL_APIS=$(jq '.apis | length' analysis.json)
DOCUMENTED=$(find docs/api -name "*.mdx" | wc -l)
COVERAGE=$((DOCUMENTED * 100 / TOTAL_APIS))

echo "API Documentation Coverage: $COVERAGE%"

# 2. Check freshness
OUTDATED=$(claude "Use autonomous-docs sync_documentation with docs_path ./docs, source_path ./src" | jq '.outdated | length')
echo "Outdated documents: $OUTDATED"

# 3. Check validation
ERRORS=$(claude "Use autonomous-docs validate_documentation with docs_path ./docs" | jq '.summary.total_errors')
echo "Validation errors: $ERRORS"

# 4. Overall health score
HEALTH_SCORE=$((COVERAGE - OUTDATED - ERRORS))
echo "Overall Health Score: $HEALTH_SCORE/100"

if [ $HEALTH_SCORE -lt 70 ]; then
  echo "⚠️  Documentation health is below threshold"
  exit 1
fi
```

### User Feedback Integration

**Feedback widget integration:**

```javascript
// Add to documentation pages
<FeedbackWidget
  page={currentPage}
  onSubmit={async (feedback) => {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        page: currentPage,
        rating: feedback.rating,
        comment: feedback.comment,
        timestamp: new Date().toISOString()
      })
    });
  }}
/>
```

**Process feedback for improvements:**

```javascript
// scripts/process-feedback.js
async function processFeedback() {
  const feedback = await fetchFeedback();

  // Find pages with low ratings
  const lowRated = feedback
    .filter(f => f.rating < 3)
    .reduce((acc, f) => {
      acc[f.page] = (acc[f.page] || 0) + 1;
      return acc;
    }, {});

  // Generate improvement tasks
  const tasks = Object.entries(lowRated)
    .filter(([page, count]) => count > 5)
    .map(([page, count]) => ({
      page,
      priority: count > 10 ? 'high' : 'medium',
      task: `Improve documentation for ${page} (${count} negative ratings)`
    }));

  // Create GitHub issues
  for (const task of tasks) {
    await createGitHubIssue(task);
  }
}
```

---

Following these best practices will ensure your documentation remains high-quality, secure, and maintainable as your project evolves.
