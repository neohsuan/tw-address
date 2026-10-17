import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'node20',
  sourcemap: true,
  banner: {
    js: '/*! Postal district data: Chunghwa Post, data.gov.tw dataset 25489, Government Data Open License v1.0. See README.md. */',
  },
});
