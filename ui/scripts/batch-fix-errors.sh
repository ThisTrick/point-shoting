#!/bin/bash
# Master script to automatically fix TypeScript errors in batch

set -e

echo "🚀 Starting batch TypeScript error fixes..."
echo ""

# Step 1: Analyze errors
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: Analyzing TypeScript errors"
echo "═══════════════════════════════════════════════════════════════"
node scripts/analyze-ts-errors.js
echo ""

# Ask for confirmation
read -p "Continue with automatic fixes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 1
fi

# Get initial error count
INITIAL_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
echo "📊 Initial error count: $INITIAL_ERRORS"
echo ""

# Step 2: Fix unused variables
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: Fixing unused variables and imports (TS6133, TS6196)"
echo "═══════════════════════════════════════════════════════════════"
node scripts/fix-unused-vars.js
echo ""

# Check progress
AFTER_UNUSED=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
FIXED_UNUSED=$((INITIAL_ERRORS - AFTER_UNUSED))
echo "✅ Fixed $FIXED_UNUSED errors. Remaining: $AFTER_UNUSED"
echo ""

# Step 3: Fix null checks
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: Fixing null/undefined checks (TS18047, TS18048, TS2532)"
echo "═══════════════════════════════════════════════════════════════"
node scripts/fix-null-checks.js
echo ""

# Check progress
AFTER_NULL=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
FIXED_NULL=$((AFTER_UNUSED - AFTER_NULL))
echo "✅ Fixed $FIXED_NULL errors. Remaining: $AFTER_NULL"
echo ""

# Step 4: Fix test imports
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 4: Fixing test imports (TS2305, TS2307)"
echo "═══════════════════════════════════════════════════════════════"
node scripts/fix-test-imports.js
echo ""

# Final check
FINAL_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
TOTAL_FIXED=$((INITIAL_ERRORS - FINAL_ERRORS))
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "BATCH FIX COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo "Initial errors:   $INITIAL_ERRORS"
echo "Fixed errors:     $TOTAL_FIXED"
echo "Remaining errors: $FINAL_ERRORS"
echo "Success rate:     $((TOTAL_FIXED * 100 / INITIAL_ERRORS))%"
echo ""

if [ "$FINAL_ERRORS" -gt 0 ]; then
    echo "⚠️  $FINAL_ERRORS errors remain and require manual fixes"
    echo ""
    echo "Next steps:"
    echo "1. Review changes: git diff"
    echo "2. Check remaining errors: npm run typecheck | less"
    echo "3. Manual fixes needed for:"
    echo "   - Type mismatches (TS2339, TS2322)"
    echo "   - Missing properties (TS2353)"
    echo "   - Argument type issues (TS2345)"
else
    echo "🎉 All errors fixed!"
fi
