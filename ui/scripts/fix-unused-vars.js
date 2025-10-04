#!/usr/bin/env node
/**
 * Auto-fix unused variables and imports
 * Fixes: TS6133 (unused variable), TS6196 (declared but never read)
 */

const fs = require('fs');
const path = require('path');

// Load error report
const reportPath = path.join(__dirname, '../.type-errors-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Error report not found. Run analyze-ts-errors.js first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Get unused variable errors
const unusedErrors = [
  ...(report.byType['TS6133'] || []),
  ...(report.byType['TS6196'] || [])
];

console.log(`🔧 Fixing ${unusedErrors.length} unused variable/import errors...\n`);

// Group by file
const byFile = {};
unusedErrors.forEach(err => {
  if (!byFile[err.file]) {
    byFile[err.file] = [];
  }
  byFile[err.file].push(err);
});

let fixedCount = 0;
let skippedCount = 0;

Object.entries(byFile).forEach(([filePath, errors]) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    skippedCount += errors.length;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract unused identifiers from error messages
  const unusedIds = errors.map(err => {
    const match = err.message.match(/'([^']+)'/);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (unusedIds.length === 0) {
    skippedCount += errors.length;
    return;
  }

  let modified = false;
  let newContent = content;

  // Strategy 1: Remove unused imports
  unusedIds.forEach(id => {
    // Remove from named imports: import { foo, bar } from 'module'
    const namedImportRegex = new RegExp(
      `(import\\s*{)([^}]*\\b${id}\\b[^}]*)(}\\s*from)`,
      'g'
    );
    newContent = newContent.replace(namedImportRegex, (match, pre, middle, post) => {
      const imports = middle.split(',').map(s => s.trim()).filter(s => !s.includes(id));
      if (imports.length === 0) {
        // Remove entire import line
        return '';
      }
      modified = true;
      return `${pre} ${imports.join(', ')} ${post}`;
    });

    // Remove standalone import: import foo from 'module'
    const standaloneImportRegex = new RegExp(
      `import\\s+${id}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`,
      'g'
    );
    if (standaloneImportRegex.test(newContent)) {
      newContent = newContent.replace(standaloneImportRegex, '');
      modified = true;
    }

    // Remove type-only imports: import type { foo } from 'module'
    const typeImportRegex = new RegExp(
      `(import\\s+type\\s*{)([^}]*\\b${id}\\b[^}]*)(}\\s*from)`,
      'g'
    );
    newContent = newContent.replace(typeImportRegex, (match, pre, middle, post) => {
      const imports = middle.split(',').map(s => s.trim()).filter(s => !s.includes(id));
      if (imports.length === 0) {
        return '';
      }
      modified = true;
      return `${pre} ${imports.join(', ')} ${post}`;
    });
  });

  // Strategy 2: Prefix unused variables with underscore
  unusedIds.forEach(id => {
    // Only for variables, not imports
    if (!newContent.includes(`import`) || !newContent.match(new RegExp(`import.*${id}`))) {
      // Function parameters
      const paramRegex = new RegExp(`\\b${id}\\b(?=\\s*[,)])`, 'g');
      newContent = newContent.replace(paramRegex, `_${id}`);
      modified = true;
    }
  });

  // Clean up empty import lines
  newContent = newContent.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
  newContent = newContent.replace(/import\s+type\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
  
  // Clean up multiple blank lines
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Fixed ${errors.length} errors in ${path.relative(process.cwd(), filePath)}`);
    fixedCount += errors.length;
  } else {
    console.log(`⚠️  Skipped ${path.relative(process.cwd(), filePath)} (no automatic fix available)`);
    skippedCount += errors.length;
  }
});

console.log(`\n✨ Complete!`);
console.log(`   Fixed: ${fixedCount} errors`);
console.log(`   Skipped: ${skippedCount} errors`);
console.log(`\n💡 Run 'npm run typecheck' to verify fixes.`);
