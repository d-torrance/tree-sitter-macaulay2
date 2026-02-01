import js from '@eslint/js';
import globals from 'globals';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import { defineConfig, globalIgnores } from 'eslint/config';
import treesitter from 'eslint-config-treesitter';

export default defineConfig([
  {
    files: ['eslint.config.mjs'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    extends: ['markdown/recommended'],
  },
  {
    files: ['grammar.js'],
    extends: [treesitter],
  },
  globalIgnores(['package-lock.json']),
]);
