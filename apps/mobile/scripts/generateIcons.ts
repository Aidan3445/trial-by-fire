/**
 * Reads SVG files from assets/icons/ and generates React Native components
 * in components/icons/generated.tsx
 *
 * Usage: npx tsx scripts/generate-icons.ts
 *
 * Each SVG file becomes a named export matching the filename:
 *   torch.svg → TorchIcon
 *   tribal-council.svg → TribalCouncilIcon
 */

import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.resolve('~/../../your-survivor-fantasy/assets/icons');
const OUTPUT_FILE = path.resolve('./src/components/icons/generated.tsx');

// Map of lowercase SVG elements → react-native-svg components
const RN_SVG_ELEMENTS: Record<string, string> = {
  circle: 'Circle',
  clipPath: 'ClipPath',
  defs: 'Defs',
  ellipse: 'Ellipse',
  g: 'G',
  image: 'Image',
  line: 'Line',
  linearGradient: 'LinearGradient',
  mask: 'Mask',
  path: 'Path',
  pattern: 'Pattern',
  polygon: 'Polygon',
  polyline: 'Polyline',
  radialGradient: 'RadialGradient',
  rect: 'Rect',
  stop: 'Stop',
  symbol: 'Symbol',
  text: 'Text',
  tspan: 'TSpan',
  use: 'Use',
};

function toComponentName(filename: string): string {
  return (
    filename
      .replace(/\.svg$/, '')
      .split(/[-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Icon'
  );
}

function convertToRNSvg(inner: string): { converted: string; usedComponents: Set<string> } {
  const usedComponents = new Set<string>();

  let converted = inner;

  // Convert opening and self-closing tags: <path ... /> and <path ...>
  for (const [lower, upper] of Object.entries(RN_SVG_ELEMENTS)) {
    const openRegex = new RegExp(`<${lower}(\\s|>|\\/)`, 'g');
    const closeRegex = new RegExp(`</${lower}>`, 'g');

    if (openRegex.test(converted) || closeRegex.test(converted)) {
      usedComponents.add(upper);
    }

    // Reset lastIndex after test
    openRegex.lastIndex = 0;
    closeRegex.lastIndex = 0;

    converted = converted.replace(openRegex, `<${upper}$1`);
    converted = converted.replace(closeRegex, `</${upper}>`);
  }

  return { converted, usedComponents };
}

function extractSvgInner(svg: string): {
  inner: string;
  attrs: Record<string, string>;
  usedComponents: Set<string>;
} {
  const attrs: Record<string, string> = {};
  const viewBoxMatch = /viewBox="([^"]+)"/.exec(svg);
  if (viewBoxMatch) attrs.viewBox = viewBoxMatch[1]!;

  const innerMatch = /<svg[^>]*>([\s\S]*)<\/svg>/i.exec(svg);
  if (!innerMatch) throw new Error('Could not parse SVG content');

  let inner = innerMatch[1]!;

  // Strip XML declarations, comments, <defs>, <style>, <filter>, <mask> blocks
  inner = inner
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<defs[\s\S]*?<\/defs>/gi, '')
    .replace(/<filter[\s\S]*?<\/filter>/gi, '')
    .replace(/<mask[\s\S]*?<\/mask>/gi, '');

  // Remove class attributes
  inner = inner.replace(/\s*class="[^"]*"/g, '');

  // Replace hardcoded colors with currentColor
  inner = inner.replace(
    /fill="(?!none|currentColor)[^"]*"/g,
    'fill="currentColor"',
  );
  inner = inner.replace(
    /stroke="(?!none|currentColor)[^"]*"/g,
    'stroke="currentColor"',
  );

  // Convert kebab-case attributes to camelCase
  inner = inner
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/stroke-opacity=/g, 'strokeOpacity=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/font-family=/g, 'fontFamily=')
    .replace(/font-size=/g, 'fontSize=')
    .replace(/font-weight=/g, 'fontWeight=')
    .replace(/text-anchor=/g, 'textAnchor=')
    .replace(/xml:space="[^"]*"/g, '')
    .replace(/xmlns:xlink="[^"]*"/g, '');

  // Trim whitespace
  inner = inner.replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');

  // Convert to RN SVG components
  const { converted, usedComponents } = convertToRNSvg(inner);

  return { inner: converted, attrs, usedComponents };
}

function generate() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith('.svg'));

  if (files.length === 0) {
    console.warn('No SVG files found in', ICONS_DIR);
    return;
  }

  const icons: { name: string; inner: string; viewBox: string }[] = [];
  const allUsedComponents = new Set<string>();

  for (const file of files) {
    const name = toComponentName(file);
    const svg = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8');
    try {
      const { inner, attrs, usedComponents } = extractSvgInner(svg);
      icons.push({ name, inner, viewBox: attrs.viewBox ?? '0 0 24 24' });
      usedComponents.forEach((c) => allUsedComponents.add(c));
      console.log(`  ✓ ${file} → ${name}`);
    } catch (e) {
      console.error(`  ✗ ${file}: ${e as Error}`);
    }
  }

  const svgImports = allUsedComponents.size > 0
    ? `import { ${[...allUsedComponents].sort().join(', ')} } from 'react-native-svg';\n`
    : '';

  const output = `// Auto-generated by scripts/generate-icons.ts — do not edit manually
/* eslint-disable @stylistic/js/jsx-quotes */
/* eslint-disable react/jsx-indent */
${svgImports}import { type IconProps, createIcon } from '~/components/common/customIcon';
export type { IconProps };

${icons
      .map(
        ({ name, inner, viewBox }) => `export const ${name} = createIcon('${name}', '${viewBox}', () => (
  <>${inner}</>
));`,
      )
      .join('\n\n')}
`;

  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nGenerated ${icons.length} icons → ${OUTPUT_FILE}`);
}

generate();
