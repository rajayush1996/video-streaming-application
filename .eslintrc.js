module.exports = {
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module', // ✅ Use 'module' if you're using ES modules
        ecmaFeatures: {
            impliedStrict: true, // ✅ Enable strict mode by default
        },
    },
    rules: {
        indent: ['error', 4],
        'object-curly-spacing': ['error', 'always'],
        'no-control-regex': 'off',
        'no-undef': 'error', // ✅ Detects undefined variables
        'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }], // ✅ Warns about unused variables
    },
    overrides: [
        {
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
};
