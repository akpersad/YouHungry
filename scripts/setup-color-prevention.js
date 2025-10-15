#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * ESLint Rule for Color Contrast Prevention
 * Prevents hardcoded color classes from being used
 */

console.log('🔧 Setting up color contrast prevention system...\n');

// Create ESLint rule for color contrast
const eslintRule = `module.exports = {
  rules: {
    // Custom rule to prevent hardcoded color classes
    'no-hardcoded-colors': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent hardcoded color classes that break dark mode',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          hardcodedColor: 'Hardcoded color class "{{color}}" detected. Use design system colors instead.',
        },
      },
      create(context) {
        const hardcodedColors = [
          // Gray colors
          'text-gray-900', 'text-gray-800', 'text-gray-700', 'text-gray-600', 'text-gray-500',
          'text-gray-400', 'text-gray-300', 'text-gray-200', 'text-gray-100',
          'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-gray-500',
          'bg-gray-400', 'bg-gray-300', 'bg-gray-200', 'bg-gray-100', 'bg-gray-50',
          'border-gray-900', 'border-gray-800', 'border-gray-700', 'border-gray-600',
          'border-gray-500', 'border-gray-400', 'border-gray-300', 'border-gray-200', 'border-gray-100',
          
          // Red colors
          'text-red-600', 'text-red-500', 'text-red-400', 'text-red-300', 'text-red-200',
          'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400',
          'border-red-200', 'border-red-300', 'border-red-400', 'border-red-500', 'border-red-600',
          
          // Blue colors
          'text-blue-600', 'text-blue-500', 'text-blue-400', 'text-blue-300', 'text-blue-200',
          'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400',
          'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500', 'border-blue-600',
          
          // Focus states
          'focus:ring-red-500', 'focus:border-red-500', 'focus:ring-blue-500', 'focus:border-blue-500',
          
          // Hover states
          'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:border-gray-300', 'hover:text-gray-700',
          'hover:bg-red-50', 'hover:bg-blue-50', 'hover:bg-blue-100',
        ];

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              hardcodedColors.forEach(color => {
                if (node.value.includes(color)) {
                  context.report({
                    node,
                    messageId: 'hardcodedColor',
                    data: { color },
                    fix(fixer) {
                      // Suggest replacement
                      let replacement = color;
                      if (color.startsWith('text-gray-')) {
                        replacement = color.includes('900') || color.includes('800') || color.includes('700') 
                          ? 'text-text' : 'text-text-light';
                      } else if (color.startsWith('bg-gray-')) {
                        replacement = color.includes('900') || color.includes('800') 
                          ? 'bg-background' : 'bg-surface';
                      } else if (color.startsWith('border-gray-')) {
                        replacement = 'border-border';
                      } else if (color.startsWith('text-red-')) {
                        replacement = 'text-destructive';
                      } else if (color.startsWith('bg-red-')) {
                        replacement = 'bg-destructive/10';
                      } else if (color.startsWith('border-red-')) {
                        replacement = 'border-destructive';
                      } else if (color.startsWith('text-blue-')) {
                        replacement = 'text-primary';
                      } else if (color.startsWith('bg-blue-')) {
                        replacement = 'bg-primary/10';
                      } else if (color.startsWith('border-blue-')) {
                        replacement = 'border-primary';
                      } else if (color.startsWith('focus:ring-red-')) {
                        replacement = 'focus:ring-destructive';
                      } else if (color.startsWith('focus:border-red-')) {
                        replacement = 'focus:border-destructive';
                      } else if (color.startsWith('focus:ring-blue-')) {
                        replacement = 'focus:ring-primary';
                      } else if (color.startsWith('focus:border-blue-')) {
                        replacement = 'focus:border-primary';
                      } else if (color.startsWith('hover:bg-gray-')) {
                        replacement = 'hover:bg-surface';
                      } else if (color.startsWith('hover:border-gray-')) {
                        replacement = 'hover:border-border';
                      } else if (color.startsWith('hover:text-gray-')) {
                        replacement = 'hover:text-text';
                      } else if (color.startsWith('hover:bg-red-')) {
                        replacement = 'hover:bg-destructive/10';
                      } else if (color.startsWith('hover:bg-blue-')) {
                        replacement = 'hover:bg-primary/10';
                      }
                      
                      return fixer.replaceText(node, node.value.replace(color, replacement));
                    },
                  });
                }
              });
            }
          },
        };
      },
    },
  },
};
`;

// Create the ESLint rule directory and file
const eslintRulesDir = path.join(process.cwd(), 'eslint-rules');
if (!fs.existsSync(eslintRulesDir)) {
  fs.mkdirSync(eslintRulesDir, { recursive: true });
}

fs.writeFileSync(
  path.join(eslintRulesDir, 'no-hardcoded-colors.js'),
  eslintRule
);

// Update ESLint config to include the custom rule
const eslintConfigPath = path.join(process.cwd(), 'eslint.config.mjs');
let eslintConfig = '';

if (fs.existsSync(eslintConfigPath)) {
  eslintConfig = fs.readFileSync(eslintConfigPath, 'utf8');

  // Add custom rule if not already present
  if (!eslintConfig.includes('no-hardcoded-colors')) {
    const customRuleImport =
      "import noHardcodedColors from './eslint-rules/no-hardcoded-colors.js';\n";
    const customRuleConfig = `
    {
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        ...noHardcodedColors.rules,
      },
    },`;

    // Insert the import at the top
    eslintConfig = customRuleImport + eslintConfig;

    // Insert the rule configuration before the closing bracket
    eslintConfig = eslintConfig.replace(
      /(\s+)(\]\s*;?\s*$)/,
      `$1${customRuleConfig}$1$2`
    );

    fs.writeFileSync(eslintConfigPath, eslintConfig);
  }
}

// Create pre-commit hook
const preCommitHook = `#!/bin/sh

# Color Contrast Check Pre-commit Hook
echo "🔍 Checking for hardcoded color classes..."

# Run the color contrast audit
node scripts/comprehensive-contrast-audit.js > /dev/null 2>&1

# Check if there are any high severity issues
HIGH_SEVERITY_COUNT=$(node scripts/comprehensive-contrast-audit.js 2>/dev/null | grep "High severity:" | grep -o '[0-9]*' | head -1)

if [ "$HIGH_SEVERITY_COUNT" -gt 0 ]; then
  echo "❌ Found $HIGH_SEVERITY_COUNT high severity color contrast issues!"
  echo "Please fix these issues before committing:"
  echo ""
  node scripts/comprehensive-contrast-audit.js | grep -A 5 "HIGH SEVERITY ISSUES" | head -20
  echo ""
  echo "Run 'npm run fix-colors' to auto-fix many issues."
  exit 1
else
  echo "✅ No high severity color contrast issues found!"
fi

# Run ESLint with custom rule
echo "🔍 Running ESLint color contrast checks..."
npx eslint src --ext .ts,.tsx --rule "no-hardcoded-colors: error" --quiet

if [ $? -ne 0 ]; then
  echo "❌ ESLint found hardcoded color classes!"
  echo "Please use design system colors instead."
  exit 1
else
  echo "✅ No hardcoded color classes found!"
fi
`;

// Create the pre-commit hook directory and file
const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
if (!fs.existsSync(gitHooksDir)) {
  fs.mkdirSync(gitHooksDir, { recursive: true });
}

fs.writeFileSync(path.join(gitHooksDir, 'pre-commit'), preCommitHook);
fs.chmodSync(path.join(gitHooksDir, 'pre-commit'), '755');

// Create package.json script
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts['check-colors'] =
    'node scripts/comprehensive-contrast-audit.js';
  packageJson.scripts['fix-colors'] =
    'node scripts/comprehensive-fix-contrast-issues.js';
  packageJson.scripts['lint-colors'] =
    'npx eslint src --ext .ts,.tsx --rule "no-hardcoded-colors: error"';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// Create VS Code settings for better development experience
const vscodeSettings = {
  'css.validate': false,
  'less.validate': false,
  'scss.validate': false,
  'tailwindCSS.experimental.classRegex': [
    ['cva\\(([^)]*)\\)', '["\'`]([^"\'`]*).*?["\'`]'],
    ['cx\\(([^)]*)\\)', "(?:'|\"|`)([^']*)(?:'|\"|`)"],
  ],
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': true,
  },
  'eslint.validate': [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
  ],
};

const vscodeDir = path.join(process.cwd(), '.vscode');
if (!fs.existsSync(vscodeDir)) {
  fs.mkdirSync(vscodeDir);
}

fs.writeFileSync(
  path.join(vscodeDir, 'settings.json'),
  JSON.stringify(vscodeSettings, null, 2)
);

console.log('✅ Color contrast prevention system set up successfully!');
console.log('\n📋 What was created:');
console.log('1. Custom ESLint rule: eslint-rules/no-hardcoded-colors.js');
console.log('2. Pre-commit hook: .git/hooks/pre-commit');
console.log('3. Package.json scripts: check-colors, fix-colors, lint-colors');
console.log('4. VS Code settings: .vscode/settings.json');
console.log('\n🚀 Usage:');
console.log('• npm run check-colors - Run color contrast audit');
console.log('• npm run fix-colors - Auto-fix color issues');
console.log('• npm run lint-colors - Lint for hardcoded colors');
console.log('• Pre-commit hook will automatically check for issues');
console.log('\n💡 The system will now prevent new hardcoded color issues!');
