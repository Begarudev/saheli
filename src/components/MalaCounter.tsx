import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius } from '../theme';

const KEY = 'cover.mala.count';
const TOTAL = 108;

type Props = {
  onTap?: () => void;
};

export function MalaCounter({ onTap }: Props = {}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setCount(parseInt(v, 10) || 0);
    });
  }, []);

  const tick = () => {
    const next = count + 1 >= TOTAL ? 0 : count + 1;
    setCount(next);
    AsyncStorage.setItem(KEY, String(next));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTap?.();
  };

  const reset = () => {
    setCount(0);
    AsyncStorage.setItem(KEY, '0');
  };

  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - count / TOTAL);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={tick} style={styles.ring}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardSoft} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.saffron}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.total}>/ {TOTAL}</Text>
        </View>
      </Pressable>
      <Pressable onPress={reset} style={styles.resetBtn}>
        <Text style={styles.resetTxt}>रीसेट / Reset</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  count: { fontSize: 48, fontWeight: '800', color: colors.saffron },
  total: { fontSize: 14, color: colors.textMuted, marginTop: -4 },
  resetBtn: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.pill,
  },
  resetTxt: { color: colors.cream, fontSize: 13 },
});
