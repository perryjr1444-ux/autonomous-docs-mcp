#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    docs: './docs',
    source: './src',
    output: './sync-report.json'
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    config[key] = args[i + 1];
  }

  return config;
}

function getLastModified(filePath) {
  try {
    const timestamp = execSync(`git log -1 --format=%ct "${filePath}"`, {
      encoding: 'utf-8'
    }).trim();
    return parseInt(timestamp) || 0;
  } catch {
    return fs.statSync(filePath).mtimeMs / 1000;
  }
}

function findFiles(dir, extensions) {
  const files = [];
  
  function walk(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function analyzeSync(config) {
  console.log('Analyzing documentation sync...');

  const sourceFiles = findFiles(config.source, ['.ts', '.tsx', '.js', '.jsx', '.py']);
  const docFiles = findFiles(config.docs, ['.md', '.mdx']);

  const results = {
    timestamp: new Date().toISOString(),
    status: 'synced',
    summary: {
      totalSourceFiles: sourceFiles.length,
      totalDocFiles: docFiles.length,
      outdatedDocs: 0,
      missingDocs: 0,
      upToDate: 0
    },
    outdated: [],
    missing: [],
    recommendations: []
  };

  // Check for outdated docs
  for (const docFile of docFiles) {
    const relativePath = path.relative(config.docs, docFile);
    const sourceEquivalent = path.join(
      config.source,
      relativePath.replace(/\.mdx?$/, '.ts')
    );

    if (fs.existsSync(sourceEquivalent)) {
      const docMod = getLastModified(docFile);
      const srcMod = getLastModified(sourceEquivalent);

      const daysBehind = Math.floor((srcMod - docMod) / 86400);

      if (daysBehind > 0) {
        results.outdated.push({
          doc: relativePath,
          source: path.relative(config.source, sourceEquivalent),
          daysBehind,
          priority: daysBehind > 7 ? 'high' : daysBehind > 3 ? 'medium' : 'low'
        });
        results.summary.outdatedDocs++;
      } else {
        results.summary.upToDate++;
      }
    }
  }

  // Check for missing docs
  const apiFiles = sourceFiles.filter(f => 
    f.includes('/api/') || 
    f.includes('/routes/') ||
    f.includes('/components/')
  );

  for (const apiFile of apiFiles) {
    const relativePath = path.relative(config.source, apiFile);
    const docEquivalent = path.join(
      config.docs,
      relativePath.replace(/\.[jt]sx?$/, '.mdx')
    );

    if (!fs.existsSync(docEquivalent)) {
      results.missing.push({
        source: relativePath,
        expectedDoc: path.relative(config.docs, docEquivalent),
        priority: apiFile.includes('/api/') ? 'high' : 'medium'
      });
      results.summary.missingDocs++;
    }
  }

  // Generate recommendations
  if (results.outdated.length > 0) {
    results.status = 'outdated';
    results.recommendations.push({
      type: 'update',
      message: `Update ${results.outdated.length} outdated documentation file(s)`,
      files: results.outdated.slice(0, 5).map(o => o.doc)
    });
  }

  if (results.missing.length > 0) {
    results.status = 'incomplete';
    results.recommendations.push({
      type: 'create',
      message: `Create documentation for ${results.missing.length} undocumented file(s)`,
      files: results.missing.slice(0, 5).map(m => m.expectedDoc)
    });
  }

  return results;
}

function main() {
  const config = parseArgs();

  if (!fs.existsSync(config.docs)) {
    console.error(`Error: Docs path not found: ${config.docs}`);
    process.exit(1);
  }

  if (!fs.existsSync(config.source)) {
    console.error(`Error: Source path not found: ${config.source}`);
    process.exit(1);
  }

  const results = analyzeSync(config);

  // Write results
  fs.mkdirSync(path.dirname(config.output), { recursive: true });
  fs.writeFileSync(config.output, JSON.stringify(results, null, 2));

  // Console output
  console.log('\n=== Documentation Sync Report ===');
  console.log(`Status: ${results.status.toUpperCase()}`);
  console.log(`\nSummary:`);
  console.log(`  Source files: ${results.summary.totalSourceFiles}`);
  console.log(`  Doc files: ${results.summary.totalDocFiles}`);
  console.log(`  Up to date: ${results.summary.upToDate}`);
  console.log(`  Outdated: ${results.summary.outdatedDocs}`);
  console.log(`  Missing: ${results.summary.missingDocs}`);

  if (results.outdated.length > 0) {
    console.log(`\nOutdated Docs (showing first 5):`);
    results.outdated.slice(0, 5).forEach(item => {
      console.log(`  - ${item.doc} (${item.daysBehind} days behind) [${item.priority}]`);
    });
  }

  if (results.missing.length > 0) {
    console.log(`\nMissing Docs (showing first 5):`);
    results.missing.slice(0, 5).forEach(item => {
      console.log(`  - ${item.expectedDoc} [${item.priority}]`);
    });
  }

  console.log(`\nFull report: ${config.output}\n`);

  // Exit code based on status
  process.exit(results.status === 'synced' ? 0 : 1);
}

main();
