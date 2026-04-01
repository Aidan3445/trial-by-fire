/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: true,
  endOfLine: 'lf',
  experimentalOperatorPosition: 'start',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxSingleQuote: true,
  objectWrap: 'collapse',
  proseWrap: 'preserve',
  printWidth: 100,
  quoteProps: 'consistent',
  requirePragma: false,
  semi: true,
  singleAttributePerLine: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss']
};

module.exports = config;
