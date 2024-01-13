/* eslint-disable no-mixed-spaces-and-tabs */
module.exports = {
    env: {
	  browser: true,
	  es2021: true,
	  node: true,
    },
    extends: ['xo'],
    parserOptions: {
	  ecmaVersion: 2021,
	  sourceType: 'module',
    },
    rules: {
	  // Add your custom rules here
	  indent: ['error', 4], // Set the number of spaces or tabs you want to enforce
    },
    overrides: [
	  {
            env: {
		  node: true,
            },
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
		  sourceType: 'script',
            },
	  },
    ],
};

