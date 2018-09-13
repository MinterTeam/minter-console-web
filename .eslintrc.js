module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    parserOptions: {
        parser: 'babel-eslint'
    },
    extends: [
        "eslint:recommended",
        // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
        // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
        'plugin:vue/essential'
    ],
    // required to lint *.vue files
    plugins: [
        'vue'
    ],
    // add your custom rules here
    rules: {
        'arrow-parens': ["error", "always"],
        'no-unused-vars': 0,
        'no-undef': 0,
        'no-console': 0,
        'no-empty': 0,
        'comma-dangle': ["error", "always-multiline"],
        'comma-spacing': ["error", { "before": false, "after": true }],
        'semi': ["error", "always"],
        'semi-spacing': "error",
        'space-before-function-paren': ["error", "never"],
    },
};
