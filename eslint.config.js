import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** Importar `Date` o `Math.random` en el dominio lo haría impuro y no determinista. */
const NO_AMBIENT_TIME = [
  'error',
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: 'El dominio es puro: recibe un Clock inyectado en vez de leer el reloj.',
  },
  {
    selector: "NewExpression[callee.name='Date']",
    message: 'El dominio es puro: no construye Date. Usa la aritmética de domain/date.ts.',
  },
  {
    selector: "MemberExpression[object.name='Math'][property.name='random']",
    message: 'El dominio es determinista: recibe un IdFactory inyectado.',
  },
];


/**
 * Las fronteras entre capas. Cada entrada dice de qué NO puede depender una
 * capa; lo que no está prohibido, está permitido.
 *
 * Se comprueban sobre el texto del import (`no-restricted-imports`), que es
 * nativo de ESLint y no depende de resolver módulos: si la regla está puesta,
 * dispara. Las verifica `scripts/check-boundaries.sh`, que mete violaciones a
 * propósito y exige que el lint falle.
 */
const LAYERS = {
  domain: {
    files: ['src/domain/**/*.ts'],
    dirs: ['config', 'ports', 'data', 'state', 'ui', 'lib'],
    packages: ['react', 'react-dom', '@supabase/supabase-js'],
    why: 'El dominio es puro: no conoce infraestructura, framework ni capas de arriba.',
  },
  ports: {
    files: ['src/ports/**/*.ts'],
    dirs: ['config', 'data', 'state', 'ui', 'lib'],
    packages: ['react', 'react-dom', '@supabase/supabase-js'],
    why: 'Un puerto es una interfaz: solo habla el lenguaje del dominio.',
  },
  config: {
    files: ['src/config/**/*.ts'],
    dirs: ['data', 'state', 'ui', 'lib'],
    packages: ['react', 'react-dom', '@supabase/supabase-js'],
    why: 'La configuración son datos: no depende de infraestructura ni de UI.',
  },
  data: {
    files: ['src/data/**/*.ts'],
    dirs: ['state', 'ui'],
    packages: [],
    why: 'Un adaptador implementa un puerto; no sabe que existe la UI.',
  },
  state: {
    files: ['src/state/**/*.ts', 'src/state/**/*.tsx'],
    dirs: ['data', 'ui'],
    packages: ['@supabase/supabase-js'],
    why: 'El estado depende de los puertos, nunca de un adaptador concreto.',
  },
  ui: {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.tsx'],
    dirs: ['data', 'ports'],
    packages: ['@supabase/supabase-js'],
    why: 'La UI lee del estado. Supabase solo se toca desde data/.',
  },
  lib: {
    files: ['src/lib/**/*.ts'],
    dirs: ['ports', 'data', 'state', 'ui'],
    packages: ['@supabase/supabase-js'],
    why: 'lib/ son utilidades genéricas: no dependen de la arquitectura de la app.',
  },
};

const layerBoundaryConfigs = Object.values(LAYERS).map((layer) => ({
  files: layer.files,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: layer.dirs.flatMap((dir) => [`**/${dir}`, `**/${dir}/**`]),
            message: layer.why,
          },
        ],
        paths: layer.packages.map((name) => ({ name, message: layer.why })),
      },
    ],
  },
}));

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'design-system',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    rules: {
      // --- Tipos: sin escapatorias ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // --- Carga cognitiva acotada ---
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],
      'no-else-return': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  ...layerBoundaryConfigs,

  // El dominio: puro y determinista.
  {
    files: ['src/domain/**/*.ts', 'src/config/**/*.ts'],
    rules: { 'no-restricted-syntax': NO_AMBIENT_TIME },
  },

  // Componentes: chicos, y con las reglas de hooks.
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'max-lines': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'react/no-array-index-key': 'off',
    },
  },

  // Las pruebas pueden ser más largas y repetitivas: ahí la claridad gana.
  {
    files: ['src/**/*.test.ts', 'src/**/*.dom.test.tsx', 'e2e/**/*.ts'],
    rules: {
      'max-lines': 'off',
      'max-params': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // Archivos de configuración: corren en Node.
  {
    files: ['*.config.ts', '*.config.js', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
);
