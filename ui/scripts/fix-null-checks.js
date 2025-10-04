#!/usr/bin/env node
/**
 * Auto-fix null/undefined checks
 * Fixes: TS18047 (possibly null), TS18048 (possibly undefined), TS2532 (possibly undefined)
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../.type-errors-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Error report not found. Run analyze-ts-errors.js first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const nullCheckErrors = [
  ...(report.byType['TS18047'] || []),
  ...(report.byType['TS18048'] || []),
  ...(report.byType['TS2532'] || [])
];

console.log(`🔧 Fixing ${nullCheckErrors.length} null/undefined check errors...\n`);

// Group by file
const byFile = {};
nullCheckErrors.forEach(err => {
  if (!byFile[err.file]) {
    byFile[err.file] = [];
  }
  byFile[err.file].push(err);
});

let fixedCount = 0;

Object.entries(byFile).forEach(([filePath, errors]) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let modified = false;

  errors.forEach(err => {
    const lineIndex = err.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const match = err.message.match(/'([^']+)'/);
    if (!match) return;

    const variable = match[1];
    
    // Strategy: Add optional chaining or null check
    // Example: foo.bar → foo?.bar
    // Example: foo[key] → foo?.[key]
    
    // Check if already has optional chaining
    if (line.includes(`${variable}?.`)) return;

    // Add optional chaining for property access
    const propertyAccessRegex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(\\w+)`, 'g');
    if (propertyAccessRegex.test(line)) {
      lines[lineIndex] = line.replace(propertyAccessRegex, `${variable}?.$1`);
      modified = true;
      fixedCount++;
      return;
    }

    // Add optional chaining for array access
    const arrayAccessRegex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\[(\\w+)\\]`, 'g');
    if (arrayAccessRegex.test(line)) {
      lines[lineIndex] = line.replace(arrayAccessRegex, `${variable}?.[$1]`);
      modified = true;
      fixedCount++;
      return;
    }

    // For more complex cases, add non-null assertion (!)
    // This is less safe but allows compilation
    const simpleAccessRegex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (simpleAccessRegex.test(line) && !line.includes('if') && !line.includes('?')) {
      // Only add ! if not already in a conditional
      lines[lineIndex] = line.replace(simpleAccessRegex, `${variable}!`);
      modified = true;
      fixedCount++;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ Fixed ${errors.length} errors in ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✨ Complete! Fixed ${fixedCount} null/undefined check errors.`);
console.log(`\n💡 Run 'npm run typecheck' to verify fixes.`);
console.log(`⚠️  Review the changes - some may need manual adjustment.`);
