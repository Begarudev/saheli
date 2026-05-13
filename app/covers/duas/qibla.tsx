import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { duasColors as c } from '../../../src/covers/themes/duas';

function Compass({ size = 240 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} stroke={c.border} strokeWidth={1.5} fill={c.card} />
      <Circle cx={cx} cy={cy} r={r - 18} stroke={c.border} strokeWidth={1} fill="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const x1 = cx + Math.cos(rad) * (r - 4);
        const y1 = cy + Math.sin(rad) * (r - 4);
        const x2 = cx + Math.cos(rad) * (r - 14);
        const y2 = cy + Math.sin(rad) * (r - 14);
        return (
          <Line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={c.accentMuted}
            strokeWidth={deg % 90 === 0 ? 2 : 1}
          />
        );
      })}
      {/* needle pointing toward Makkah (illustrative) */}
      <G transform={`rotate(-22 ${cx} ${cy})`}>
        <Path
          d={`M${cx} ${cy - r + 24} L${cx - 8} ${cy} L${cx} ${cy + 16} L${cx + 8} ${cy} Z`}
          fill={c.accent}
        />
        <Circle cx={cx} cy={cy} r={5} fill={c.cream} />
      </G>
    </Svg>
  );
}

export default function Qibla() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.head}>
        <Text style={styles.title}>क़िबला · Qibla</Text>
        <Text style={styles.sub}>Aim toward Makkah</Text>
      </View>
      <View style={styles.body}>
        <Compass />
        <Text style={styles.note}>
          Direction is illustrative. For accuracy, calibrate your compass and check a verified
          source.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: c.cream },
  sub: { fontSize: 12, color: c.textMuted, marginTop: 4, letterSpacing: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  note: { marginTop: 24, fontSize: 12, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
});
