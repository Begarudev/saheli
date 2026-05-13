import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { BlockPrintDivider } from '../../src/components/BlockPrintDivider';
import { colors, radius, spacing, fonts } from '../../src/theme';
import {
  VaultIcon,
  ScaleIcon,
  ClipboardCheckIcon,
  HeartPulseIcon,
  GearIcon,
} from '../../src/components/icons';

type TileDef = {
  key: string;
  hi: string;
  en: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const TILES: TileDef[] = [
  { key: 'vault', hi: 'सबूत', en: 'Evidence', href: '/saheli/vault', Icon: VaultIcon },
  { key: 'rights', hi: 'अधिकार', en: 'Rights', href: '/saheli/rights', Icon: ScaleIcon },
  { key: 'entitlements', hi: 'योजना', en: 'Schemes', href: '/saheli/entitlements', Icon: ClipboardCheckIcon },
  { key: 'health', hi: 'सेहत', en: 'Health', href: '/saheli/health', Icon: HeartPulseIcon },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SosHero() {
  const pulse = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * press.value }],
  }));

  return (
    <View style={sosStyles.wrap}>
      <Text style={sosStyles.headline}>मदद चाहिए?</Text>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="SOS — open safety screen"
        onPressIn={() => {
          press.value = withSpring(0.96, { stiffness: 220, damping: 18 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { stiffness: 180, damping: 18 });
        }}
        onPress={() => router.push('/saheli/safety' as never)}
        style={[sosStyles.button, buttonStyle]}
      >
        <Text style={sosStyles.sosHi}>मदद</Text>
        <Text style={sosStyles.sosText}>SOS</Text>
      </AnimatedPressable>
      <Text style={sosStyles.hint}>Press to send help · बटन दबाएं</Text>
    </View>
  );
}

function Tile({ tile }: { tile: TileDef }) {
  const press = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const { Icon } = tile;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${tile.en} — ${tile.hi}`}
      onPressIn={() => {
        press.value = withSpring(0.97, { stiffness: 220, damping: 18 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { stiffness: 180, damping: 18 });
      }}
      onPress={() => router.push(tile.href as never)}
      style={[tileStyles.tile, aStyle]}
    >
      <View style={tileStyles.iconSlot}>
        <Icon size={22} color={colors.inkTeal} />
      </View>
      <View style={tileStyles.textBlock}>
        <Text style={tileStyles.hi}>{tile.hi}</Text>
        <Text style={tileStyles.en}>{tile.en}</Text>
      </View>
    </AnimatedPressable>
  );
}

function SmsFooterCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send SAHELI to 56161 by SMS"
      onPress={() => Linking.openURL('sms:56161?body=SAHELI').catch(() => {})}
      style={({ pressed }) => [smsStyles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={smsStyles.titleHi}>SMS भी काम करता है</Text>
        <Text style={smsStyles.titleEn}>Works on feature phones too — SAHELI to 56161</Text>
      </View>
      <View style={smsStyles.cta}>
        <Text style={smsStyles.ctaTxt}>Send SMS</Text>
      </View>
    </Pressable>
  );
}

export default function SaheliHome() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.header}>
          <Text style={styles.brand}>सहेली</Text>
          <View style={styles.headerActions}>
            <QuickExitButton />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/saheli/settings' as never)}
              hitSlop={12}
              style={styles.gearBtn}
            >
              <GearIcon size={20} color={colors.indigo} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.greetingHi}>नमस्ते। आप क्या करना चाहती हैं?</Text>
        <Text style={styles.greetingEn}>Welcome. What would you like to do?</Text>

        <View style={styles.sosCard}>
          <SosHero />
        </View>

        <View style={styles.dividerWrap}>
          <BlockPrintDivider horizontalPadding={spacing.xl} />
        </View>

        <View style={styles.tilesGrid}>
          <View style={styles.tilesRow}>
            <Tile tile={TILES[0]} />
            <Tile tile={TILES[1]} />
          </View>
          <View style={styles.tilesRow}>
            <Tile tile={TILES[2]} />
            <Tile tile={TILES[3]} />
          </View>
        </View>

        <View style={styles.smsWrap}>
          <SmsFooterCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brand: {
    fontFamily: fonts.hiDisplay,
    fontSize: 26,
    color: colors.indigo,
    lineHeight: 32,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
    lineHeight: 26,
    color: colors.indigo,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    opacity: 0.9,
  },
  greetingEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 18,
    color: colors.taupe,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: 2,
  },
  sosCard: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  dividerWrap: {
    paddingVertical: spacing.lg,
  },
  tilesGrid: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smsWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
});

const sosStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  headline: {
    fontFamily: fonts.hiDisplay,
    fontSize: 36,
    lineHeight: 44,
    color: colors.indigo,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.sindoor,
    borderWidth: 3,
    borderColor: '#a93630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 22,
    lineHeight: 28,
    color: colors.cream,
  },
  sosText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.cream,
    opacity: 0.85,
    letterSpacing: 3,
    marginTop: 4,
  },
  hint: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.taupe,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});

const smsStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    lineHeight: 22,
    color: colors.indigo,
  },
  titleEn: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 14,
    color: colors.taupe,
    marginTop: 2,
  },
  cta: {
    backgroundColor: colors.indigo,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaTxt: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 120,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.18)',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  iconSlot: {
    width: 22,
    height: 22,
  },
  textBlock: {},
  hi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 22,
    lineHeight: 28,
    color: colors.indigo,
  },
  en: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.taupe,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
