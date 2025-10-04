#!/usr/bin/env node
/**
 * TypeScript Error Classification and Analysis Script
 * Classifies all TS errors by type, file, and suggests automatic fixes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run typecheck and capture errors
console.log('🔍 Running TypeScript type check...\n');
let output;
try {
  output = execSync('npm run typecheck 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (error) {
  // TypeScript errors cause non-zero exit code, but we still get the output
  output = error.stdout || error.output?.join('') || '';
}

// Parse errors
const errorLines = output.split('\n').filter(line => line.includes('error TS'));

// Error type descriptions
const ERROR_TYPES = {
  'TS2339': 'Property does not exist on type',
  'TS6133': 'Variable declared but never used',
  'TS2322': 'Type assignment mismatch',
  'TS2353': 'Object literal may only specify known properties',
  'TS2345': 'Argument type mismatch',
  'TS7006': 'Parameter implicitly has any type',
  'TS18047': 'Variable is possibly null',
  'TS2300': 'Duplicate identifier',
  'TS18048': 'Variable is possibly undefined',
  'TS6196': 'Variable declared but value never read',
  'TS2678': 'Type assertion incompatible',
  'TS2307': 'Cannot find module',
  'TS4114': 'Property must have explicit type',
  'TS2554': 'Expected N arguments, but got M',
  'TS2305': 'Module has no exported member',
  'TS2739': 'Type is missing properties',
  'TS2367': 'Comparison expression always returns',
  'TS1345': 'Expression of type void cannot be tested',
  'TS7015': 'Element implicitly has any type',
  'TS2769': 'No overload matches call',
  'TS2724': 'Module has no exported member (duplicate)',
  'TS2559': 'Type has no properties in common',
  'TS2532': 'Object is possibly undefined',
};

// Parse error structure
const errors = [];
errorLines.forEach(line => {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
  if (match) {
    const [, file, line, col, code, message] = match;
    errors.push({
      file: file.trim(),
      line: parseInt(line),
      col: parseInt(col),
      code,
      message: message.trim()
    });
  }
});

console.log(`📊 Found ${errors.length} TypeScript errors\n`);

// Classify by error type
const byType = {};
errors.forEach(err => {
  if (!byType[err.code]) {
    byType[err.code] = [];
  }
  byType[err.code].push(err);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('ERROR CLASSIFICATION BY TYPE');
console.log('═══════════════════════════════════════════════════════════════\n');

Object.entries(byType)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([code, errs]) => {
    console.log(`${code}: ${ERROR_TYPES[code] || 'Unknown'}`);
    console.log(`  Count: ${errs.length}`);
    console.log(`  Auto-fixable: ${isAutoFixable(code) ? '✅ YES' : '❌ NO'}`);
    console.log();
  });

// Classify by file
const byFile = {};
errors.forEach(err => {
  if (!byFile[err.file]) {
    byFile[err.file] = [];
  }
  byFile[err.file].push(err);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('ERROR CLASSIFICATION BY FILE');
console.log('═══════════════════════════════════════════════════════════════\n');

Object.entries(byFile)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .forEach(([file, errs]) => {
    const relPath = file.replace(process.cwd(), '.');
    console.log(`${relPath}`);
    console.log(`  Errors: ${errs.length}`);
    const errorTypes = [...new Set(errs.map(e => e.code))].join(', ');
    console.log(`  Types: ${errorTypes}`);
    console.log();
  });

// Classify by category
const categories = {
  tests: errors.filter(e => e.file.includes('/tests/')),
  renderer: errors.filter(e => e.file.includes('/renderer/') && !e.file.includes('/tests/')),
  main: errors.filter(e => e.file.includes('/main/') && !e.file.includes('/tests/')),
  shared: errors.filter(e => e.file.includes('/shared/')),
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('ERROR CLASSIFICATION BY CATEGORY');
console.log('═══════════════════════════════════════════════════════════════\n');

Object.entries(categories).forEach(([category, errs]) => {
  console.log(`${category.toUpperCase()}: ${errs.length} errors`);
});
console.log();

// Generate fix recommendations
console.log('═══════════════════════════════════════════════════════════════');
console.log('AUTOMATIC FIX RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════════\n');

const fixableCount = Object.entries(byType)
  .filter(([code]) => isAutoFixable(code))
  .reduce((sum, [, errs]) => sum + errs.length, 0);

console.log(`✅ Auto-fixable: ${fixableCount} errors (${Math.round(fixableCount/errors.length*100)}%)`);
console.log(`⚠️  Manual review: ${errors.length - fixableCount} errors\n`);

console.log('Suggested fix order:');
console.log('1. Run fix-unused-vars.js → Fix TS6133, TS6196 (44 errors)');
console.log('2. Run fix-duplicate-ids.js → Fix TS2300 (6 errors)');
console.log('3. Run fix-null-checks.js → Fix TS18047, TS18048, TS2532 (16 errors)');
console.log('4. Run fix-test-imports.js → Fix TS2305, TS2307 in tests (9 errors)');
console.log('5. Manual: Fix type mismatches (TS2339, TS2322, TS2353) (131 errors)');
console.log();

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  totalErrors: errors.length,
  byType,
  byFile,
  byCategory: Object.fromEntries(
    Object.entries(categories).map(([k, v]) => [k, v.length])
  ),
  autoFixable: fixableCount,
  errors
};

fs.writeFileSync(
  path.join(__dirname, '../.type-errors-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('📝 Detailed report saved to: .type-errors-report.json\n');

function isAutoFixable(code) {
  const autoFixableCodes = [
    'TS6133', // Unused variable
    'TS6196', // Declared but never read
    'TS2300', // Duplicate identifier
    'TS18047', // Possibly null (add null check)
    'TS18048', // Possibly undefined (add undefined check)
    'TS2305', // Missing import (can suggest)
    'TS2307', // Cannot find module (can suggest)
  ];
  return autoFixableCodes.includes(code);
}
