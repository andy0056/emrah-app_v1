#!/usr/bin/env node

/**
 * Migration Script for Refactored Codebase
 * Helps transition from old structure to new modular structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change to project root directory
process.chdir(path.join(__dirname, '..'));

console.log('🚀 Starting codebase migration...\n');

// Step 1: Backup original falService.ts
if (fs.existsSync('src/services/falService.ts')) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `src/services/falService.ts.backup.${timestamp}`;

  fs.copyFileSync('src/services/falService.ts', backupPath);
  console.log(`✅ Backed up original falService.ts to ${backupPath}`);
} else {
  console.log('⚠️ Original falService.ts not found');
}

// Step 2: Replace falService.ts with new version
if (fs.existsSync('src/services/falServiceNew.ts')) {
  fs.copyFileSync('src/services/falServiceNew.ts', 'src/services/falService.ts');
  console.log('✅ Replaced falService.ts with modular version');

  // Clean up
  fs.unlinkSync('src/services/falServiceNew.ts');
  console.log('✅ Cleaned up temporary files');
} else {
  console.log('❌ falServiceNew.ts not found - run refactoring first');
  process.exit(1);
}

// Step 3: Update package.json with new scripts
if (fs.existsSync('package.json.new')) {
  fs.copyFileSync('package.json', 'package.json.backup');
  fs.copyFileSync('package.json.new', 'package.json');
  fs.unlinkSync('package.json.new');
  console.log('✅ Updated package.json with development scripts');
}

// Step 4: Create git commit for migration
console.log('\n📝 Next steps:');
console.log('1. Run: npm install (to install new dev dependencies)');
console.log('2. Run: npm run lint (to check for any import issues)');
console.log('3. Run: npm run type-check (to verify TypeScript)');
console.log('4. Run: npm run test (to ensure tests pass)');
console.log('5. Test the application thoroughly');
console.log('6. Commit changes: git add . && git commit -m "refactor: modular architecture migration"');

console.log('\n🎉 Migration complete!');
console.log('📖 See REFACTORING.md for detailed changes and next steps');