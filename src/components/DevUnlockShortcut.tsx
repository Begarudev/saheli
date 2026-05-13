import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';

/**
 * Demo-mode escape hatch. In __DEV__ only, taps a hidden 40x40 region in the
 * top-left corner; 3 taps within 1.5s unlocks to Saheli. Production builds
 * render nothing.
 */
export function DevUnlockShortcut() {
  const { unlockToSaheli } = useApp();
  const tapsRef = useRef<number[]>([]);

  if (!__DEV__) return null;

  const onTap = () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 1500), now];
    if (tapsRef.current.length >= 3) {
      tapsRef.current = [];
      unlockToSaheli();
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        accessibilityLabel="Dev unlock"
        onPress={onTap}
        hitSlop={4}
        style={styles.hit}
      />
      <Text style={styles.marker} pointerEvents="none">[DEV]</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    zIndex: 9999,
  },
  hit: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
  },
  marker: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 8,
    color: colors.indigoSoft,
    opacity: 0.45,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
