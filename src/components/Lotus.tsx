import React, { useEffect } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  size?: number;
  onTap?: () => void;
  onLongPress?: () => void;
};

export function Lotus({ size = 220, onTap, onLongPress }: Props) {
  const rot = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rot]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Pressable onPress={onTap} onLongPress={onLongPress} delayLongPress={4000}>
      <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ rotate: spin }] }]}>
        <Svg width={size} height={size} viewBox="-100 -100 200 200">
          <AnimatedG>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 360) / 8;
              return (
                <G key={i} rotation={angle} origin="0,0">
                  <Path
                    d="M0,-80 C30,-50 30,-20 0,0 C-30,-20 -30,-50 0,-80 Z"
                    fill={i % 2 === 0 ? colors.saffron : colors.crimsonBright}
                    opacity={0.85}
                  />
                </G>
              );
            })}
          </AnimatedG>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8 + 22.5;
            return (
              <G key={`inner-${i}`} rotation={angle} origin="0,0">
                <Path d="M0,-50 C18,-30 18,-10 0,0 C-18,-10 -18,-30 0,-50 Z" fill={colors.cream} opacity={0.95} />
              </G>
            );
          })}
          <Circle cx={0} cy={0} r={18} fill={colors.saffronDeep} />
          <Circle cx={0} cy={0} r={9} fill={colors.crimson} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
