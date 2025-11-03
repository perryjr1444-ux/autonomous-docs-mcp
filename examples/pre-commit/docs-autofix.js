#!/usr/bin/env node

/**
 * Auto-fix common documentation issues
 */

const fs = require('fs');
const path = require('path');

const fixes = {
  addedFrontmatter: 0,
  fixedCodeBlocks: 0,
  fixedLinks: 0
};

function autoFix(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Add frontmatter if missing
  if (!content.startsWith('---')) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const title = fileName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const frontmatter = `---\ntitle: "${title}"\ndescription: "${title} documentation"\n---\n\n`;
    content = frontmatter + content;
    modified = true;
    fixes.addedFrontmatter++;
  }

  // Fix code blocks without language
  content = content.replace(/```\n/g, (match, offset) => {
    // Try to detect language from content
    const nextLine = content.substring(offset + 4, offset + 50);
    if (nextLine.includes('function') || nextLine.includes('const') || nextLine.includes('import')) {
      fixes.fixedCodeBlocks++;
      modified = true;
      return '```typescript\n';
    }
    return match;
  });

  // Fix relative links (basic)
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Ensure .mdx extension on internal links
    if (!url.includes('://') && !url.startsWith('#') && !url.includes('.')) {
      fixes.fixedLinks++;
      modified = true;
      return `[${text}](${url}.mdx)`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Auto-fixed: ${filePath}`);
  }
}

// Get files from command line args
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No files to fix');
  process.exit(0);
}

console.log('Running auto-fix on documentation files...');

files.forEach(file => {
  if (file.match(/\.(md|mdx)$/)) {
    autoFix(file);
  }
});

console.log('\nAuto-fix summary:');
console.log(`  Added frontmatter: ${fixes.addedFrontmatter}`);
console.log(`  Fixed code blocks: ${fixes.fixedCodeBlocks}`);
console.log(`  Fixed links: ${fixes.fixedLinks}`);

process.exit(0);
