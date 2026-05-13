import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  tint?: string;
  height?: number;
  /** Horizontal padding to subtract from window width when computing tile count. */
  horizontalPadding?: number;
};

const TILE_W = 80;
const TILE_H = 16;

/**
 * Block-print horizontal divider — stylized Ajrakh/Bagh motif rendered as
 * react-native-svg, repeating the 80×16 tile to fill the viewport. Sits on
 * cream bg in indigo at 30% opacity by default.
 */
export function BlockPrintDivider({ tint, height = TILE_H, horizontalPadding = 0 }: Props) {
  const { width } = useWindowDimensions();
  const usable = Math.max(0, width - horizontalPadding * 2);
  const tiles = Math.max(1, Math.ceil(usable / TILE_W));
  const stroke = tint ?? colors.indigo;
  return (
    <View style={[styles.row, { height }]}>
      {Array.from({ length: tiles }).map((_, i) => (
        <Svg key={i} width={TILE_W} height={height} viewBox={`0 0 ${TILE_W} ${TILE_H}`}>
          <G stroke={stroke} strokeOpacity={0.3} strokeWidth={1.2} fill="none">
            <Path d="M0 8 L80 8" />
            <Path d="M10 4 L14 8 L10 12 L6 8 Z" />
            <Path d="M30 4 L34 8 L30 12 L26 8 Z" />
            <Path d="M50 4 L54 8 L50 12 L46 8 Z" />
            <Path d="M70 4 L74 8 L70 12 L66 8 Z" />
            <Circle cx={20} cy={8} r={1.4} />
            <Circle cx={40} cy={8} r={1.4} />
            <Circle cx={60} cy={8} r={1.4} />
          </G>
        </Svg>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
  },
});
