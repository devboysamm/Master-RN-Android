// Map a font weight to the actual bundled font file's family name, so Android
// renders the real weight (e.g. Manrope_800ExtraBold) instead of synthesizing
// a heavier face from the Regular file. The reference (iOS/Expo) used
// `fontFamily: 'Manrope'` + `fontWeight`; on a bare Android build we resolve the
// weight to a concrete family name here. Bundled weights live in
// android/app/src/main/assets/fonts.

const MANROPE: Record<string, string> = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};

const MONO: Record<string, string> = {
  '400': 'JetBrainsMono_400Regular',
  '600': 'JetBrainsMono_600SemiBold',
  '700': 'JetBrainsMono_700Bold',
  '800': 'JetBrainsMono_800ExtraBold',
};

/**
 * Returns the bundled font-family name for a weight. Use it as the `fontFamily`
 * style value (do not also set `fontWeight` — the family already encodes it):
 *   { fontFamily: font('800') }            // Manrope ExtraBold
 *   { fontFamily: font('700', 'mono') }    // JetBrains Mono Bold
 */
export function font(weight: string = '400', family: 'sans' | 'mono' = 'sans'): string {
  const table = family === 'mono' ? MONO : MANROPE;
  return table[weight] ?? table['400'];
}
