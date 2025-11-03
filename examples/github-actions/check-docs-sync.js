#!/usr/bin/env node

/**
 * Check if documentation is in sync with source code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function checkSync() {
  console.log('Checking documentation sync...\n');

  const results = {
    inSync: true,
    outdated: [],
    missing: [],
    recommendations: []
  };

  // Check if source files were modified more recently than docs
  const srcFiles = execSync('git ls-files src/**/*.ts').toString().trim().split('\n');
  const docsFiles = execSync('git ls-files docs/**/*.mdx').toString().trim().split('\n');

  for (const srcFile of srcFiles) {
    try {
      const srcMod = execSync(`git log -1 --format=%ct ${srcFile}`).toString().trim();
      const docFile = srcFile.replace('src/', 'docs/').replace('.ts', '.mdx');
      
      if (docsFiles.includes(docFile)) {
        const docMod = execSync(`git log -1 --format=%ct ${docFile}`).toString().trim();
        
        if (parseInt(srcMod) > parseInt(docMod)) {
          results.outdated.push({
            source: srcFile,
            doc: docFile,
            daysBehind: Math.floor((parseInt(srcMod) - parseInt(docMod)) / 86400)
          });
          results.inSync = false;
        }
      } else {
        results.missing.push(srcFile);
        results.inSync = false;
      }
    } catch (err) {
      // File might be new
    }
  }

  // Generate report
  console.log('Sync Status:', results.inSync ? '✅ In Sync' : '⚠️  Out of Sync');
  console.log('Outdated Docs:', results.outdated.length);
  console.log('Missing Docs:', results.missing.length);

  if (!results.inSync) {
    console.log('\n--- Outdated Files ---');
    results.outdated.slice(0, 5).forEach(item => {
      console.log(`  ${item.doc} (${item.daysBehind} days behind)`);
    });

    console.log('\n--- Missing Documentation ---');
    results.missing.slice(0, 5).forEach(file => {
      console.log(`  ${file}`);
    });

    console.log('\nRecommendation: Run docs regeneration workflow');
  }

  // Write results for workflow
  fs.writeFileSync('sync-check.json', JSON.stringify(results, null, 2));

  process.exit(results.inSync ? 0 : 1);
}

checkSync().catch(err => {
  console.error('Sync check failed:', err);
  process.exit(1);
});
