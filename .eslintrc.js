module.exports = {
    env: {
        browser: true, // Enable browser environment
        node: true, // Enable Node.js environment
        es2021: true, // Enable ES2021 syntax
    },
    parserOptions: {
        ecmaVersion: 2022, // Specify the ECMAScript version (use numeric value for clarity)
        sourceType: 'script', // Use 'script' for CommonJS; change to 'module' if using ES modules
    },
    rules: {
        // Custom rules
        indent: ['error', 4], // Enforce 4 spaces for indentation
        'object-curly-spacing': ['error', 'always'], // Enforce spacing inside curly braces
        'no-control-regex': 'off', // Turn off control character rule in regular expressions
    },
    overrides: [
        {
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script', // Treat these files as CommonJS
            },
        },
    ],
};
