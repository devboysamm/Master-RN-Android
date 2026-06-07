import React from 'react';
import Svg, { Path, G, Ellipse, Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';

type Props = {
  size?: number;
  strokeWidth?: number;
  /** Accepted for API parity; this build renders the atom static. */
  spin?: boolean;
  // Some uses (e.g. the small top-right atom on Auth) omit the center dot.
  showDot?: boolean;
};

// Static atom logo. The reference animates the three orbits via reanimated when
// `spin` is set; here they sit at their rest angles (0/60/120°). The auth
// screens use it non-spinning, so this matches them exactly. (reanimated deferred.)
export default function AtomLogo({ size = 92, strokeWidth = 7, showDot = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220">
      <Path
        d="M110 6c52 0 78 0 92 14s14 40 14 92-0 78-14 92-40 14-92 14-78 0-92-14S4 174 4 122s-0-78 14-92S58 6 110 6Z"
        fill={colors.coral}
      />
      {[0, 60, 120].map((deg) => (
        <G key={deg} rotation={deg} originX={110} originY={110}>
          <Ellipse cx={110} cy={110} rx={84} ry={32} fill="none" stroke={colors.atomInk} strokeWidth={strokeWidth} />
        </G>
      ))}
      {showDot && <Circle cx={110} cy={110} r={14} fill={colors.atomInk} />}
    </Svg>
  );
}
