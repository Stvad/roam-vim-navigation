const js = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const globals = require('globals')

module.exports = [
    {
        ignores: ['coverage/**', 'dist/**', 'extension.js', 'node_modules/**'],
    },
    {
        ...js.configs.recommended,
        files: ['*.js', '*.cjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'off',
        },
    },
    {
        ...js.configs.recommended,
        files: ['scripts/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'off',
        },
    },
    {
        files: ['src/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.es2020,
                ...globals.jest,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off',
            'no-constant-condition': ['error', {checkLoops: false}],
            'no-redeclare': 'off',
            'no-shadow': 'off',
            'no-undef': 'off',
            'prefer-const': 'error',
        },
    },
    {
        files: ['src/@types/**/*.d.ts'],
        rules: {
            '@typescript-eslint/no-namespace': 'off',
        },
    },
]
