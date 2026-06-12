// eslint-config-next 16 ships native flat configs — no FlatCompat needed.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.agents/**',
      '.cursor/**',
      '.github/skills/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'scripts/**',
      'performance-metrics/**',
      'coverage/**',
      'src/__tests__/**',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Project convention: never raw console.* in src/ — use the structured
    // logger (src/lib/logger.ts) instead. e2e/ and public/sw.js are outside
    // src/ and legitimately write to the console/terminal.
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'error',
    },
  },
  {
    // The logger wraps console by design.
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
