module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
      ],
      env: {
        browser: true,
        es6: true,
      },
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.eslint.json'],
        sourceType: 'module',
      },
      rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        // fixme
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.js'],
      extends: 'eslint:recommended',
      env: {
        node: true,
        es6: true,
      },
      rules: {
        'comma-dangle': ['error', 'always-multiline'],
        indent: ['error', 2],
      },
    },
  ],
};
