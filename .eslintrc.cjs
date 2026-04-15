module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        jest: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    ignorePatterns: ['coverage/', 'dist/', 'extension.js', 'node_modules/'],
    rules: {
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
    overrides: [
        {
            files: ['src/@types/**/*.d.ts'],
            rules: {
                '@typescript-eslint/no-namespace': 'off',
            },
        },
    ],
}
