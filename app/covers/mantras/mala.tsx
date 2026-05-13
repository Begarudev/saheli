import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MalaCounter } from '../../../src/components/MalaCounter';
import { colors, spacing, typography } from '../../../src/theme';
import { useApp } from '../../../src/state/AppContext';
import { useStealthSOSGesture } from '../../../src/hooks/useStealthSOSGesture';

export default function MalaScreen() {
  const { registerTrackerTap } = useApp();
  const handleStealthSOS = useStealthSOSGesture();

  const onBeadTap = useCallback(() => {
    registerTrackerTap();
    handleStealthSOS();
  }, [registerTrackerTap, handleStealthSOS]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ImageBackground
        source={require('../../../assets/lotus_pink.jpg')}
        imageStyle={{ opacity: 0.15 }}
        style={styles.bg}
      >
        <LinearGradient colors={[colors.crimson, colors.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <Text style={styles.title}>जप माला · Japa Mala</Text>
            <Text style={styles.sub}>Tap the bead to count · 108 manke</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
      <View style={styles.body}>
        <MalaCounter onTap={onBeadTap} />
        <Text style={styles.tip}>“ॐ नमः शिवाय” — चित्त को एकाग्र करें</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { paddingBottom: spacing.lg },
  head: { padding: spacing.xl },
  title: { ...typography.h1 },
  sub: { ...typography.small, marginTop: 4 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  tip: { marginTop: spacing.xxl, color: colors.saffron, fontSize: 16, textAlign: 'center' },
});
