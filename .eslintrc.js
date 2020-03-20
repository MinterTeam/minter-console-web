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
        'eslint:recommended',
        // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
        // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
        'plugin:vue/recommended',
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
        'space-before-function-paren': ["error", {"anonymous": "never", "named": "never", "asyncArrow": "always"}],

        // VUE STRONGLY-RECOMMENDED
        'vue/html-closing-bracket-spacing': 0,
        'vue/html-indent': 0,
        // 'vue/html-indent': ["warn", 4, {
        //     "attribute": 1,
        //     "baseIndent": 1,
        //     "closeBracket": 0,
        //     "alignAttributesVertically": true,
        //     "ignores": []
        // }],
        'vue/html-self-closing': 0,
        // 'vue/html-self-closing': ["warn", {
        //     "html": {
        //         "void": "never",
        //         "normal": "never",
        //         "component": "always"
        //     },
        //     "svg": "any",
        //     "math": "any"
        // }],
        'vue/max-attributes-per-line': 0,
        'vue/singleline-html-element-content-newline': 0,
        'vue/v-bind-style': 0,
        'vue/v-on-style': 0,
        'vue/no-unused-vars': 0,
        // allow `$value`
        'vue/prop-name-casing': 0,

        // VUE RECOMMENDED
        'vue/no-v-html': 0,
        'vue/attribute-hyphenation': 0,
        "vue/attributes-order": 0,
        // "vue/attributes-order": ["warn", {
        //     "order": [
        //         "DEFINITION",
        //         "LIST_RENDERING",
        //         "CONDITIONALS",
        //         "RENDER_MODIFIERS",
        //         // "GLOBAL", // allow to be first
        //         "UNIQUE",
        //         "TWO_WAY_BINDING",
        //         // "OTHER_DIRECTIVES", // allow to be first
        //         // "OTHER_ATTR", // allow html attributes to be first
        //         "EVENTS",
        //         "CONTENT"
        //     ]
        // }],
        "vue/order-in-components": ["error", {
            "order": [
                'el',
                'name',
                'parent',
                'functional',
                ['delimiters', 'comments'],
                ['components', 'directives', 'filters'],
                'extends',
                'mixins',
                'inheritAttrs',
                'model',
                ['props', 'propsData'],
                "fetch",
                "asyncData",
                "head",
                'data',
                'computed',
                'watch',
                'LIFECYCLE_HOOKS',
                'methods',
                ['template', 'render'],
                'renderError'
            ]
        }],
    },
};
