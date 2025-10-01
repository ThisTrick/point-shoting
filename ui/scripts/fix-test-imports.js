#!/usr/bin/env node
/**
 * Auto-fix test import issues
 * Fixes: TS2305 (module has no exported member), TS2307 (cannot find module)
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../.type-errors-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Error report not found. Run analyze-ts-errors.js first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const importErrors = [
  ...(report.byType['TS2305'] || []),
  ...(report.byType['TS2307'] || [])
].filter(err => err.file.includes('/tests/'));

console.log(`🔧 Fixing ${importErrors.length} test import errors...\n`);

// Common fixes for test imports
const IMPORT_FIXES = {
  // ElectronAPI type fixes
  'ElectronAPI': {
    from: '../contexts/ElectronContext',
    to: '@shared/types'
  },
  'SettingsPreset': {
    remove: true, // This type doesn't exist anymore
  },
  'AnimationConfig': {
    from: '../contexts/SettingsContext',
    to: '@shared/types'
  },
  'EngineStatus': {
    from: '../contexts/EngineContext',
    to: '@shared/engine'
  },
  'UISettings': {
    from: '../contexts/SettingsContext',
    to: '@shared/core'
  },
};

// Group by file
const byFile = {};
importErrors.forEach(err => {
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

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  errors.forEach(err => {
    const match = err.message.match(/'([^']+)'/);
    if (!match) return;

    const memberName = match[1];
    const fix = IMPORT_FIXES[memberName];

    if (!fix) {
      console.log(`⚠️  No fix defined for: ${memberName} in ${path.basename(filePath)}`);
      return;
    }

    if (fix.remove) {
      // Remove the import
      const importRegex = new RegExp(
        `import\\s+(?:type\\s+)?{[^}]*\\b${memberName}\\b[^}]*}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`,
        'g'
      );
      content = content.replace(importRegex, (match) => {
        const imports = match.match(/{([^}]+)}/)?.[1]
          .split(',')
          .map(s => s.trim())
          .filter(s => !s.includes(memberName));
        
        if (!imports || imports.length === 0) {
          modified = true;
          fixedCount++;
          return '';
        }
        
        const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch) {
          modified = true;
          fixedCount++;
          return match.replace(/{[^}]+}/, `{ ${imports.join(', ')} }`);
        }
        return match;
      });

      // Also remove from inline usage
      content = content.replace(new RegExp(`\\b${memberName}\\b`, 'g'), 'any');
    } else if (fix.to) {
      // Change import source
      const importRegex = new RegExp(
        `(import\\s+(?:type\\s+)?{[^}]*\\b${memberName}\\b[^}]*})\\s+from\\s+['"]${fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
        'g'
      );
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `$1 from '${fix.to}'`);
        modified = true;
        fixedCount++;
      } else {
        // Add missing import
        const importStatement = `import type { ${memberName} } from '${fix.to}';\n`;
        const firstImportMatch = content.match(/^import\s/m);
        if (firstImportMatch) {
          const insertIndex = content.indexOf(firstImportMatch[0]);
          content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
        } else {
          content = importStatement + content;
        }
        modified = true;
        fixedCount++;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed imports in ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✨ Complete! Fixed ${fixedCount} import errors.`);
console.log(`\n💡 Run 'npm run typecheck' to verify fixes.`);
