import globals from 'globals'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 'latest',
    },
    rules: {
      'eqeqeq': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': 'error',
      'no-console': 'off',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]