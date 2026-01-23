import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

/**
 * PARCHE: Filtra reglas obsoletas de Airbnb que rompen ESLint 9 / TS-ESLint v8
 */
function fixupConfig(config) {
    if (!config.rules) return config;

    const rulesToRemove = [
        // Reglas de formato eliminadas en v8
        '@typescript-eslint/brace-style',
        '@typescript-eslint/comma-dangle',
        '@typescript-eslint/comma-spacing',
        '@typescript-eslint/func-call-spacing',
        '@typescript-eslint/indent',
        '@typescript-eslint/keyword-spacing',
        '@typescript-eslint/lines-between-class-members',
        '@typescript-eslint/no-extra-parens',
        '@typescript-eslint/no-extra-semi',
        '@typescript-eslint/object-curly-spacing',
        '@typescript-eslint/padding-line-between-statements',
        '@typescript-eslint/quotes',
        '@typescript-eslint/semi',
        '@typescript-eslint/space-before-blocks',
        '@typescript-eslint/space-before-function-paren',
        '@typescript-eslint/space-infix-ops',

        // Reglas renombradas o deprecadas que causan el error actual
        '@typescript-eslint/no-throw-literal', // El culpable de tu error (ahora es only-throw-error)
    ];

    const newRules = { ...config.rules };
    rulesToRemove.forEach((rule) => {
        delete newRules[rule];
    });

    return { ...config, rules: newRules };
}

// Cargamos airbnb-typescript pasando el filtro
const airbnbTypescriptCompat = compat.extends('airbnb-typescript').map(fixupConfig);

export default [
    // 1. Reglas base JS
    js.configs.recommended,

    // 2. Globales
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },

    // 3. Airbnb Base
    ...compat.extends('airbnb'),

    // 4. Airbnb TypeScript (Parcheado)
    ...airbnbTypescriptCompat,

    // 5. Ajustes de tu proyecto
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'import/prefer-default-export': 'off',
            'react/jsx-props-no-spreading': 'off',
            'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
            'react/require-default-props': 'off',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',

            // Reemplazo manual para la regla que fallaba (opcional)
            '@typescript-eslint/only-throw-error': 'error',
        },
    },

    // 6. Ignorar carpetas
    {
        ignores: ['dist/*', 'node_modules/*', 'public/*', 'build/*', 'bootstrap/ssr/*'],
    },
];
