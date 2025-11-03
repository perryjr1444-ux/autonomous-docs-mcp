# Troubleshooting Guide

Comprehensive reference for diagnosing and resolving issues with autonomous-docs-mcp.

## Table of Contents

- [Common Errors and Solutions](#common-errors-and-solutions)
- [Debug Procedures](#debug-procedures)
- [Performance Issues](#performance-issues)
- [MCP Connectivity Problems](#mcp-connectivity-problems)
- [Validation Failures](#validation-failures)
- [Integration Issues](#integration-issues)

## Common Errors and Solutions

### Analysis Failures

#### Error: "Cannot read property 'files' of undefined"

**Symptom:**
```
Error: Cannot read property 'files' of undefined
    at buildStructure (codebase-analyzer.ts:193)
```

**Root Cause:**
The analyzer failed to discover files in the target directory, often due to incorrect path or permission issues.

**Resolution:**
```bash
# 1. Verify the path exists
ls -la /path/to/project

# 2. Check permissions
stat /path/to/project

# 3. Use absolute path
claude "Use autonomous-docs analyze_codebase with path $(pwd)/project"

# 4. Verify include/exclude patterns
claude "Use autonomous-docs analyze_codebase with path ., include_patterns ['**/*.ts'], exclude_patterns ['node_modules/**']"
```

**Prevention:**
- Always use absolute paths when possible
- Test path accessibility before analysis
- Verify glob patterns match expected files

---

#### Error: "EACCES: permission denied"

**Symptom:**
```
Error: EACCES: permission denied, scandir '/path/to/directory'
```

**Root Cause:**
The MCP server doesn't have permission to read certain directories.

**Resolution:**
```bash
# 1. Check directory permissions
ls -ld /path/to/directory

# 2. Grant read permissions
chmod -R +r /path/to/directory

# 3. If in Docker, ensure volume permissions
docker run -v $(pwd):/workspace:ro autonomous-docs

# 4. Exclude problematic directories
claude "Use autonomous-docs analyze_codebase with path ., exclude_patterns ['restricted/**']"
```

**Prevention:**
- Run analysis with appropriate user permissions
- Add permission checks to pre-analysis scripts
- Document required permissions in README

---

#### Error: "Memory limit exceeded during analysis"

**Symptom:**
```
FATAL ERROR: Reached heap limit
Allocation failed - JavaScript heap out of memory
```

**Root Cause:**
Analyzing very large codebases without proper memory allocation.

**Resolution:**
```bash
# 1. Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. Use quick analysis depth for large projects
claude "Use autonomous-docs analyze_codebase with path ., depth quick"

# 3. Analyze in chunks
./scripts/analyze-incrementally.sh

# 4. Exclude large generated files
claude "Use autonomous-docs analyze_codebase with path ., exclude_patterns ['dist/**', 'build/**', '*.min.js']"
```

**Script for incremental analysis:**
```bash
#!/bin/bash
# scripts/analyze-incrementally.sh

DIRS=("src/api" "src/components" "src/utils")

for dir in "${DIRS[@]}"; do
  echo "Analyzing $dir..."
  claude "Use autonomous-docs analyze_codebase with path $dir, depth standard" > "analysis-$dir.json"
done

# Merge results
jq -s 'reduce .[] as $item ({}; .apis += $item.apis | .components += $item.components)' analysis-*.json > combined-analysis.json
```

**Prevention:**
- Monitor memory usage during analysis
- Use appropriate depth for project size
- Implement chunked analysis for monorepos

---

### Generation Errors

#### Error: "Invalid analysis_result format"

**Symptom:**
```
Error: Invalid analysis_result: SyntaxError: Unexpected token in JSON at position 0
```

**Root Cause:**
The analysis result passed to generate_documentation is malformed or not valid JSON.

**Resolution:**
```bash
# 1. Validate JSON structure
cat analysis.json | jq .

# 2. Check for proper escaping when passing inline
ANALYSIS=$(cat analysis.json | jq -c .)
claude "Use autonomous-docs generate_documentation with analysis_result '$ANALYSIS', output_dir ./docs"

# 3. Use file reference instead
# Save analysis to file, then reference it
claude "Use autonomous-docs analyze_codebase..." > analysis.json
claude "Use autonomous-docs generate_documentation with analysis_result $(cat analysis.json), output_dir ./docs"
```

**Prevention:**
- Always validate JSON before passing to tools
- Use `jq` for JSON manipulation
- Store analysis results in files for complex workflows

---

#### Error: "Output directory is not empty"

**Symptom:**
```
Error: Output directory ./docs already exists and is not empty
```

**Root Cause:**
Generation tool refuses to overwrite existing documentation without explicit confirmation.

**Resolution:**
```bash
# 1. Backup existing docs
mv docs docs-backup-$(date +%Y%m%d)

# 2. Clear output directory
rm -rf docs/*

# 3. Or use a new output directory
claude "Use autonomous-docs generate_documentation with analysis_result $(cat analysis.json), output_dir ./docs-new"

# 4. Enable force mode (if available)
claude "Use autonomous-docs generate_documentation with analysis_result $(cat analysis.json), output_dir ./docs, force true"
```

**Prevention:**
- Use version control to track documentation changes
- Implement backup scripts before regeneration
- Use CI/CD to manage documentation lifecycle

---

#### Error: "Failed to parse TypeScript file"

**Symptom:**
```
Error: Failed to parse src/components/Button.tsx: Unexpected token
```

**Root Cause:**
The analyzer encountered TypeScript syntax it cannot parse, often due to experimental features or JSX issues.

**Resolution:**
```bash
# 1. Check TypeScript configuration
cat tsconfig.json

# 2. Ensure compatible TypeScript version
npm install typescript@latest

# 3. Exclude problematic files temporarily
claude "Use autonomous-docs analyze_codebase with path ., exclude_patterns ['src/experimental/**']"

# 4. Update analyzer version
npm update autonomous-docs-mcp
```

**Prevention:**
- Keep TypeScript and autonomous-docs-mcp versions compatible
- Use standard TypeScript features when possible
- Test analysis on a sample of files first

---

### Sync Issues

#### Error: "Cannot determine file changes"

**Symptom:**
```
Error: Cannot determine file changes: Not a git repository
```

**Root Cause:**
Sync tool requires git to detect changes, but the directory is not a git repository.

**Resolution:**
```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit"

# 2. Use alternative sync method
claude "Use autonomous-docs analyze_codebase..." > new-analysis.json
# Compare with previous analysis manually

# 3. Force full regeneration
claude "Use autonomous-docs generate_documentation with analysis_result $(cat new-analysis.json), output_dir ./docs"
```

**Prevention:**
- Always use version control for projects
- Document non-git alternatives
- Implement custom change detection if needed

---

## Debug Procedures

### Step-by-Step Debugging Workflow

#### 1. Enable Debug Logging

```bash
# Set environment variable for verbose logging
export DEBUG=autonomous-docs:*

# Or for Node.js applications
export NODE_DEBUG=*

# Run analysis with debug output
claude "Use autonomous-docs analyze_codebase with path ." 2> debug.log
```

#### 2. Isolate the Problem

```bash
# Test individual components
# A. Test file discovery
node -e "const glob = require('glob'); glob('**/*.ts', {cwd: './src'}, (err, files) => console.log(files))"

# B. Test single file analysis
claude "Use autonomous-docs analyze_codebase with path ./src/index.ts, depth quick"

# C. Test minimal generation
echo '{"structure":{"root":"test","files":[],"languages":[],"frameworks":[]},"apis":[],"components":[],"documentation_needs":[],"suggested_navigation":{"groups":[]},"metadata":{"name":"test"}}' > minimal.json
claude "Use autonomous-docs generate_documentation with analysis_result $(cat minimal.json), output_dir ./test-docs"
```

#### 3. Check Dependencies

```bash
# Verify MCP server is running
claude mcp list

# Check autonomous-docs-mcp installation
npm list autonomous-docs-mcp

# Verify Node.js version
node --version  # Should be 18+

# Check required dependencies
npm list glob fs-extra gray-matter js-yaml
```

#### 4. Test MCP Connection

```bash
# Direct MCP server test
node /path/to/autonomous-docs-mcp/dist/index.js << EOF
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
EOF

# Claude CLI MCP test
claude "List all available MCP tools"
```

#### 5. Collect Diagnostic Information

```bash
#!/bin/bash
# scripts/collect-diagnostics.sh

echo "Collecting diagnostic information..."

{
  echo "=== System Information ==="
  uname -a
  node --version
  npm --version

  echo ""
  echo "=== Claude CLI Configuration ==="
  cat ~/.claude.json || echo "Config not found"

  echo ""
  echo "=== MCP Server Status ==="
  claude mcp list

  echo ""
  echo "=== autonomous-docs-mcp Installation ==="
  npm list autonomous-docs-mcp

  echo ""
  echo "=== Recent Logs ==="
  tail -n 50 /tmp/claude-mcp.log || echo "No logs found"

  echo ""
  echo "=== Disk Space ==="
  df -h

  echo ""
  echo "=== Memory Usage ==="
  free -h || vm_stat

} > diagnostics-$(date +%Y%m%d-%H%M%S).txt

echo "Diagnostics saved to diagnostics-$(date +%Y%m%d-%H%M%S).txt"
```

---

### Log Analysis Techniques

#### Understanding Log Patterns

**Normal analysis log:**
```
[autonomous-docs] Analyzing codebase at /project...
[autonomous-docs] Found 247 files
[autonomous-docs] Detected languages: TypeScript, JavaScript
[autonomous-docs] Extracted 45 API definitions
[autonomous-docs] Identified 23 components
[autonomous-docs] Analysis complete in 3.2s
```

**Problematic log:**
```
[autonomous-docs] Analyzing codebase at /project...
[autonomous-docs] Found 0 files  ← PROBLEM: No files found
[autonomous-docs] Analysis complete in 0.1s
```

#### Log Filtering and Analysis

```bash
# Extract errors only
grep -i error debug.log

# Find performance bottlenecks
grep -E "took [0-9]+ms" debug.log | sort -t: -k2 -n

# Identify failed file operations
grep -E "(ENOENT|EACCES|EISDIR)" debug.log

# Track tool invocations
grep "CallToolRequestSchema" debug.log
```

---

### Verbose Mode Usage

```javascript
// Enable verbose output in code
const analyzer = new CodebaseAnalyzer({ verbose: true });

// Pass debug flag to tools
claude "Use autonomous-docs analyze_codebase with path ., debug true"

// Custom debug wrapper
#!/bin/bash
# scripts/debug-wrapper.sh

set -x  # Enable bash debug mode
export DEBUG=*

claude "$@" 2>&1 | tee -a debug-output.log
```

---

## Performance Issues

### Slow Analysis Troubleshooting

#### Symptom: Analysis takes > 10 minutes

**Diagnosis:**
```bash
# Profile the analysis
time claude "Use autonomous-docs analyze_codebase with path ."

# Check system resources during analysis
watch -n 1 'ps aux | grep node | grep -v grep'
```

**Resolution:**
```bash
# 1. Use quick depth for initial scan
claude "Use autonomous-docs analyze_codebase with path ., depth quick"

# 2. Reduce scope with include_patterns
claude "Use autonomous-docs analyze_codebase with path ., include_patterns ['src/**/*.ts']"

# 3. Exclude large directories
claude "Use autonomous-docs analyze_codebase with path ., exclude_patterns ['node_modules/**', 'dist/**', 'coverage/**']"

# 4. Analyze in parallel by directory
find src -type d -maxdepth 1 | xargs -P 4 -I {} \
  sh -c 'claude "Use autonomous-docs analyze_codebase with path {}"'
```

**Optimization script:**
```javascript
// scripts/optimize-analysis.js
const minimatch = require('minimatch');

// Pre-filter files before analysis
function getOptimizedFileList(rootPath) {
  const allFiles = getFiles(rootPath);

  // Prioritize files likely to have documentation needs
  const prioritized = allFiles
    .filter(f => !f.includes('test'))
    .filter(f => !f.includes('.spec.'))
    .filter(f => f.match(/\.(ts|js|py)$/))
    .sort((a, b) => {
      // API files first
      if (a.includes('api') && !b.includes('api')) return -1;
      if (b.includes('api') && !a.includes('api')) return 1;
      return 0;
    });

  return prioritized;
}
```

---

### Memory Consumption Problems

#### Symptom: Process killed due to OOM

**Diagnosis:**
```bash
# Monitor memory during analysis
while true; do
  ps aux | grep "node.*autonomous-docs" | awk '{print $4"%", $11}';
  sleep 1;
done

# Check system memory
free -h  # Linux
vm_stat  # macOS
```

**Resolution:**
```bash
# 1. Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=8192"

# 2. Use streaming for large codebases
# (requires custom implementation)

# 3. Analyze in smaller chunks
./scripts/chunked-analysis.sh

# 4. Use more efficient patterns
claude "Use autonomous-docs analyze_codebase with path ., exclude_patterns ['**/*.min.js', '**/*.bundle.js']"
```

**Memory-efficient chunked analysis:**
```bash
#!/bin/bash
# scripts/chunked-analysis.sh

CHUNK_SIZE=100
TEMP_DIR=".docs-chunks"

mkdir -p "$TEMP_DIR"

# Get all files and split into chunks
find src -name "*.ts" | split -l $CHUNK_SIZE - "$TEMP_DIR/chunk-"

# Analyze each chunk
for chunk in "$TEMP_DIR"/chunk-*; do
  FILES=$(cat "$chunk" | tr '\n' ',' | sed 's/,$//')
  claude "Use autonomous-docs analyze_codebase with include_patterns [$FILES]" > "$chunk.json"

  # Clear memory between chunks
  sleep 2
done

# Merge results
jq -s 'reduce .[] as $item ({}; .apis += ($item.apis // []) | .components += ($item.components // []))' "$TEMP_DIR"/*.json > combined-analysis.json

# Cleanup
rm -rf "$TEMP_DIR"
```

---

### Large Codebase Handling

#### Optimization Strategies

**1. Hierarchical Analysis:**
```bash
#!/bin/bash
# scripts/hierarchical-analysis.sh

# Analyze top-level directories separately
for dir in src/api src/components src/utils; do
  echo "Analyzing $dir..."
  claude "Use autonomous-docs analyze_codebase with path $dir, depth standard" > "analysis-$(basename $dir).json"
done

# Generate navigation structure
cat > docs.json << EOF
{
  "navigation": [
    {"group": "API", "pages": ["api/overview"]},
    {"group": "Components", "pages": ["components/overview"]},
    {"group": "Utils", "pages": ["utils/overview"]}
  ]
}
EOF
```

**2. Selective Documentation:**
```javascript
// scripts/selective-docs.js

// Only document public APIs
const publicFiles = files.filter(f =>
  !f.includes('internal') &&
  !f.includes('.private.') &&
  !f.includes('/test/')
);

// Prioritize by importance
const prioritized = publicFiles.sort((a, b) => {
  const weights = {
    'api/': 100,
    'components/': 80,
    'utils/': 60,
    'helpers/': 40
  };

  const weightA = Object.entries(weights)
    .find(([path]) => a.includes(path))?.[1] || 0;
  const weightB = Object.entries(weights)
    .find(([path]) => b.includes(path))?.[1] || 0;

  return weightB - weightA;
});
```

**3. Caching Layer:**
```javascript
// scripts/cached-analyzer.js
const fs = require('fs-extra');
const crypto = require('crypto');

class CachedAnalyzer {
  constructor(cacheDir = '.docs-cache') {
    this.cacheDir = cacheDir;
    fs.ensureDirSync(cacheDir);
  }

  getCacheKey(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stat = fs.statSync(filePath);
    return crypto
      .createHash('sha256')
      .update(content + stat.mtimeMs)
      .digest('hex');
  }

  async analyzeWithCache(filePath) {
    const cacheKey = this.getCacheKey(filePath);
    const cachePath = `${this.cacheDir}/${cacheKey}.json`;

    if (await fs.pathExists(cachePath)) {
      console.log(`Cache hit: ${filePath}`);
      return await fs.readJson(cachePath);
    }

    console.log(`Cache miss: ${filePath}`);
    const result = await this.analyze(filePath);

    await fs.writeJson(cachePath, result);
    return result;
  }
}
```

---

## MCP Connectivity Problems

### Server Connection Failures

#### Error: "MCP server not responding"

**Symptom:**
```
Error: Request timeout - MCP server did not respond
```

**Diagnosis:**
```bash
# 1. Check if MCP server is configured
cat ~/.claude.json | jq '.mcpServers."autonomous-docs"'

# 2. Test server directly
node /path/to/autonomous-docs-mcp/dist/index.js

# 3. Check process status
ps aux | grep "autonomous-docs"

# 4. Verify server can start
node -e "require('/path/to/autonomous-docs-mcp/dist/index.js')" &
sleep 2
ps aux | grep node
```

**Resolution:**
```bash
# 1. Rebuild the MCP server
cd /path/to/autonomous-docs-mcp
npm run build

# 2. Update Claude configuration
cat > ~/.claude.json << EOF
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["$(npm root -g)/autonomous-docs-mcp/dist/index.js"]
    }
  }
}
EOF

# 3. Restart Claude CLI
# (close terminal and reopen)

# 4. Test connection
claude "List available autonomous-docs tools"
```

---

### Tool Invocation Errors

#### Error: "Tool not found: analyze_codebase"

**Symptom:**
```
Error: Tool not found: analyze_codebase
Available tools: [list of other tools]
```

**Diagnosis:**
```bash
# Check available MCP servers
claude mcp list

# Verify autonomous-docs is registered
claude mcp list | grep autonomous-docs

# Test tool listing
claude "What tools are available from autonomous-docs?"
```

**Resolution:**
```bash
# 1. Reinstall MCP server
npm uninstall -g autonomous-docs-mcp
npm install -g autonomous-docs-mcp

# 2. Verify installation
npm list -g autonomous-docs-mcp

# 3. Update Claude configuration
# Make sure path is correct
which node  # Get node path
npm root -g  # Get global modules path

# 4. Restart Claude CLI environment
```

---

### Transport Issues

#### Error: "EPIPE: broken pipe"

**Symptom:**
```
Error: write EPIPE
    at WriteWrap.onWriteComplete [as oncomplete] (internal/stream_base_commons.js:94:16)
```

**Diagnosis:**
```bash
# Check for conflicting processes
lsof -i :8000  # If MCP uses specific port

# Monitor process lifecycle
strace -p $(pgrep -f autonomous-docs) 2>&1 | grep -E "(PIPE|EPIPE)"
```

**Resolution:**
```bash
# 1. Increase timeout in Claude configuration
cat > ~/.claude.json << EOF
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["$(npm root -g)/autonomous-docs-mcp/dist/index.js"],
      "timeout": 60000
    }
  }
}
EOF

# 2. Use stdio transport instead of HTTP (default for autonomous-docs-mcp)
# No changes needed - already uses stdio

# 3. Check for process limits
ulimit -n  # File descriptor limit
ulimit -n 4096  # Increase if needed
```

---

### Configuration Problems

#### Error: "Invalid MCP configuration"

**Symptom:**
```
Error: Failed to parse MCP configuration: Unexpected token
```

**Diagnosis:**
```bash
# Validate JSON syntax
cat ~/.claude.json | jq .

# Check for common issues
cat ~/.claude.json | jq '.mcpServers'
```

**Resolution:**
```bash
# 1. Fix JSON syntax
# Common issues: trailing commas, unquoted keys, missing brackets

# 2. Use valid configuration template
cat > ~/.claude.json << 'EOF'
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/autonomous-docs-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

# 3. Validate configuration
jq . ~/.claude.json || echo "Invalid JSON"

# 4. Test with minimal config
cat > ~/.claude.json << EOF
{"mcpServers":{"autonomous-docs":{"command":"node","args":["$(npm root -g)/autonomous-docs-mcp/dist/index.js"]}}}
EOF
```

---

## Validation Failures

### Frontmatter Errors

#### Error: "Missing required frontmatter field: title"

**Symptom:**
```json
{
  "valid": false,
  "errors": [{
    "file": "docs/api/endpoint.mdx",
    "type": "missing_frontmatter",
    "message": "Missing required frontmatter field: title"
  }]
}
```

**Resolution:**
```bash
# 1. Add missing frontmatter
cat > docs/api/endpoint.mdx << 'EOF'
---
title: "API Endpoint"
description: "Description of the endpoint"
---

# API Endpoint

...
EOF

# 2. Bulk fix missing frontmatter
find docs -name "*.mdx" -exec sh -c '
  if ! grep -q "^---" "$1"; then
    FILENAME=$(basename "$1" .mdx)
    TITLE=$(echo "$FILENAME" | sed "s/-/ /g" | sed "s/\b\(.\)/\u\1/g")
    {
      echo "---"
      echo "title: \"$TITLE\""
      echo "description: \"Documentation for $TITLE\""
      echo "---"
      echo ""
      cat "$1"
    } > "$1.tmp"
    mv "$1.tmp" "$1"
  fi
' sh {} \;

# 3. Use frontmatter validation script
./scripts/fix-frontmatter.js
```

**Bulk frontmatter fixer:**
```javascript
// scripts/fix-frontmatter.js
const fs = require('fs-extra');
const matter = require('gray-matter');
const glob = require('glob');

async function fixFrontmatter() {
  const files = glob.sync('docs/**/*.mdx');

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const parsed = matter(content);

    let modified = false;

    // Add missing title
    if (!parsed.data.title) {
      const filename = file.split('/').pop().replace('.mdx', '');
      parsed.data.title = filename
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      modified = true;
    }

    // Add missing description
    if (!parsed.data.description) {
      parsed.data.description = `Documentation for ${parsed.data.title}`;
      modified = true;
    }

    if (modified) {
      const updated = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(file, updated);
      console.log(`Fixed: ${file}`);
    }
  }
}

fixFrontmatter();
```

---

### Link Validation Issues

#### Error: "Broken internal link"

**Symptom:**
```json
{
  "errors": [{
    "file": "docs/guide.mdx",
    "type": "broken_link",
    "message": "Broken internal link: /api/missing-page"
  }]
}
```

**Resolution:**
```bash
# 1. Find the broken link
grep -r "/api/missing-page" docs/

# 2. Fix the link
sed -i 's|/api/missing-page|/api/existing-page|g' docs/guide.mdx

# 3. Or create the missing page
mkdir -p docs/api
cat > docs/api/missing-page.mdx << 'EOF'
---
title: "Missing Page"
description: "Documentation page"
---

# Missing Page

Content here...
EOF

# 4. Bulk link checker and fixer
./scripts/fix-broken-links.sh
```

**Link fixer script:**
```bash
#!/bin/bash
# scripts/fix-broken-links.sh

echo "Checking for broken links..."

# Get validation results
claude "Use autonomous-docs validate_documentation with docs_path ./docs, check_links true" > validation.json

# Extract broken links
jq -r '.errors[] | select(.type == "broken_link") | "\(.file):\(.message)"' validation.json > broken-links.txt

if [ -s broken-links.txt ]; then
  echo "Found broken links:"
  cat broken-links.txt

  # Create issue for manual review
  cat broken-links.txt | while IFS=: read file message; do
    echo "- [ ] Fix link in $file: $message"
  done > fix-links-todo.md

  echo "Created fix-links-todo.md with action items"
else
  echo "No broken links found"
fi
```

---

### Code Example Syntax Problems

#### Error: "Code block missing language specifier"

**Symptom:**
```json
{
  "warnings": [{
    "file": "docs/example.mdx",
    "type": "missing_code_language",
    "message": "Code block missing language specifier"
  }]
}
```

**Resolution:**
```bash
# 1. Find code blocks without language
grep -n '```$' docs/**/*.mdx

# 2. Manually add language specifiers
# Before:
# ```
# const x = 1;
# ```

# After:
# ```typescript
# const x = 1;
# ```

# 3. Automated fix for common cases
./scripts/add-code-languages.sh
```

**Automated language detection:**
```javascript
// scripts/add-code-languages.js
const fs = require('fs-extra');
const glob = require('glob');

function detectLanguage(code) {
  // Simple heuristics
  if (code.includes('import ') || code.includes('const ') || code.includes('=>')) {
    if (code.includes('<') && code.includes('/>')) return 'tsx';
    return 'typescript';
  }
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('func ') || code.includes('package ')) return 'go';
  if (code.includes('<?php')) return 'php';
  if (code.includes('#!/bin/bash') || code.includes('echo ')) return 'bash';
  return 'text';
}

async function addLanguages() {
  const files = glob.sync('docs/**/*.mdx');

  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    let modified = false;

    // Find code blocks without language
    content = content.replace(/```\n([\s\S]*?)```/g, (match, code) => {
      const lang = detectLanguage(code);
      modified = true;
      return '```' + lang + '\n' + code + '```';
    });

    if (modified) {
      await fs.writeFile(file, content);
      console.log(`Fixed: ${file}`);
    }
  }
}

addLanguages();
```

---

### MDX Parsing Errors

#### Error: "Unexpected token '<'"

**Symptom:**
```
Error: Could not parse MDX:
  Unexpected token '<' at line 15
```

**Resolution:**
```bash
# 1. Locate the problematic file
# Error should indicate file and line number

# 2. Check for common MDX issues:
#    - Unescaped JSX outside components
#    - Missing closing tags
#    - Invalid component syntax

# 3. Validate MDX syntax
npx mdx-check docs/problematic-file.mdx

# 4. Common fixes:
# Escape HTML entities
sed -i 's/</\&lt;/g' docs/file.mdx

# Or wrap in code blocks
# Before: <Component>
# After: `<Component>`

# 5. Batch validate all MDX files
find docs -name "*.mdx" -exec npx mdx-check {} \;
```

---

## Integration Issues

### GitHub Actions Failures

#### Error: "Authentication failed"

**Symptom:**
```
Error: Authentication failed for 'https://github.com/user/repo.git'
```

**Resolution:**
```yaml
# Ensure GITHUB_TOKEN has correct permissions
permissions:
  contents: write  # Required for pushing docs
  pull-requests: write  # Required for PR comments

# Use personal access token if needed
- name: Checkout
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT_TOKEN }}
```

---

#### Error: "Node.js version mismatch"

**Symptom:**
```
Error: The engine "node" is incompatible with this module. Expected version ">=18"
```

**Resolution:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Use compatible version
    cache: 'npm'
```

---

### CI/CD Pipeline Problems

#### Error: "Build timeout"

**Symptom:**
```
Error: Job exceeded maximum execution time (360 minutes)
```

**Resolution:**
```yaml
# Optimize the pipeline
jobs:
  docs:
    timeout-minutes: 30  # Set reasonable timeout
    steps:
      # Use quick analysis in CI
      - run: claude "Use autonomous-docs analyze_codebase with path ., depth quick"

      # Cache dependencies
      - uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      # Run in parallel where possible
      - run: npm run docs:generate -- --parallel
```

---

### Permission and Access Issues

#### Error: "EACCES: permission denied, open '/docs/file.mdx'"

**Symptom:**
```
Error: EACCES: permission denied, open '/docs/api/endpoint.mdx'
```

**Resolution:**
```bash
# 1. Fix file permissions
chmod -R u+w docs/

# 2. In CI/CD, ensure correct user
# Docker:
USER node
RUN chmod -R 755 /workspace

# GitHub Actions:
- name: Fix permissions
  run: |
    sudo chown -R $USER:$USER docs/
    chmod -R u+w docs/
```

---

### Environment-specific Problems

#### Issue: Works locally but fails in CI/CD

**Diagnosis:**
```bash
# Compare environments
echo "Local:"
node --version
npm --version
which node

echo "CI:" # (run in CI)
node --version
npm --version
which node
```

**Resolution:**
```yaml
# Match local environment in CI
- uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'  # Use same version as local

# Replicate local environment variables
env:
  NODE_ENV: production
  CI: true

# Use same dependency versions
- run: npm ci  # Instead of npm install
```

---

## Emergency Recovery Procedures

### Corrupted Documentation Recovery

```bash
#!/bin/bash
# scripts/emergency-recovery.sh

echo "Starting emergency recovery..."

# 1. Backup current state
timestamp=$(date +%Y%m%d-%H%M%S)
cp -r docs "docs-corrupted-$timestamp"

# 2. Restore from git
git checkout HEAD docs/

# 3. If no git history, regenerate from scratch
if [ $? -ne 0 ]; then
  echo "No git history, regenerating..."
  claude "Use autonomous-docs analyze_codebase with path ., depth comprehensive" > emergency-analysis.json
  claude "Use autonomous-docs generate_documentation with analysis_result $(cat emergency-analysis.json), output_dir ./docs-recovered"
  mv docs-recovered docs
fi

# 4. Validate recovery
claude "Use autonomous-docs validate_documentation with docs_path ./docs"

echo "Recovery complete"
```

---

### Complete Reset Procedure

```bash
#!/bin/bash
# scripts/complete-reset.sh

echo "⚠️  This will completely reset your documentation setup"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# 1. Backup everything
tar -czf docs-backup-$(date +%Y%m%d-%H%M%S).tar.gz docs/ .docs-* analysis.json

# 2. Clean slate
rm -rf docs/
rm -rf .docs-*
rm -f analysis.json

# 3. Reinstall MCP server
npm uninstall -g autonomous-docs-mcp
npm cache clean --force
npm install -g autonomous-docs-mcp

# 4. Rebuild configuration
cat > ~/.claude.json << EOF
{
  "mcpServers": {
    "autonomous-docs": {
      "command": "node",
      "args": ["$(npm root -g)/autonomous-docs-mcp/dist/index.js"]
    }
  }
}
EOF

# 5. Fresh start
./scripts/setup-docs.sh

echo "✅ Reset complete"
```

---

This troubleshooting guide covers the most common issues you'll encounter with autonomous-docs-mcp. For issues not covered here, please check the GitHub issues or create a new issue with diagnostic information from the debug procedures above.
