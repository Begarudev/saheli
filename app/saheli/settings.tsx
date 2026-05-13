import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../src/state/AppContext';
import { COVERS, getCoverById } from '../../src/covers';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import { readTelemetry, clearTelemetry, type TelemetryEntry } from '../../src/services/sarvam';
import { clearCache, cacheSize } from '../../src/services/semcache';
import { listItems } from '../../src/services/vault';

const RIGHTS_HISTORY_KEY = 'saheli.rights.history';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const cover = getCoverById(settings.coverId);

  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [semSize, setSemSize] = useState(0);
  const [vaultCount, setVaultCount] = useState(0);

  const refreshAi = useCallback(async () => {
    setTelemetry(await readTelemetry());
    setSemSize(await cacheSize());
    setVaultCount((await listItems()).length);
  }, []);
  useEffect(() => {
    refreshAi();
  }, [refreshAi]);

  const aiStats = computeTelemetryStats(telemetry);

  const onClearSemcache = () => {
    Alert.alert('Clear AI cache?', 'सहेज लिया गया semantic cache मिट जाएगा।', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          refreshAi();
        },
      },
    ]);
  };
  const onClearTelemetry = () => {
    Alert.alert('Clear AI telemetry?', 'सारे usage stats मिट जाएँगे।', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearTelemetry();
          refreshAi();
        },
      },
    ]);
  };

  const togglePrivacy = async (next: boolean) => {
    if (next) {
      // Turning ON — push picker.
      router.push('/onboarding/pick-cover' as never);
    } else {
      await updateSettings({ privacyMode: false, coverId: null });
    }
  };

  const changeCover = () => router.push('/onboarding/pick-cover' as never);

  const clearRights = () => {
    Alert.alert(
      'Clear Rights chat',
      'This will delete your saved Rights chat history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(RIGHTS_HISTORY_KEY);
            Alert.alert('Cleared', 'Rights chat history has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: spacing.xl }}>
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={styles.titleHi}>सेटिंग्स</Text>
        <Text style={styles.titleEn}>Settings · privacy, data, AI usage</Text>
      </View>
      <Section title="Privacy">
        <View style={[styles.row, styles.privacyRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyHi}>गुप्त मोड</Text>
            <Text style={styles.privacyEn}>Privacy Mode</Text>
            <Text style={styles.privacyExplain}>
              Saheli को किसी और ऐप के पीछे छिपाएँ। अगर फ़ोन साझा है तभी चालू करें।
            </Text>
          </View>
          <Switch
            value={settings.privacyMode}
            onValueChange={togglePrivacy}
            trackColor={{ true: colors.indigo, false: 'rgba(28, 36, 84, 0.15)' }}
            thumbColor={colors.cream}
          />
        </View>
        {settings.privacyMode && (
          <Pressable onPress={changeCover} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Cover</Text>
              <Text style={styles.rowSub}>
                {cover ? `${cover.nameHi} · ${cover.name}` : 'Pick a cover'}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      </Section>

      <Section title="Safety">
        <Pressable
          onPress={() => router.push('/saheli/safety' as never)}
          style={styles.row}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Trusted Contacts</Text>
            <Text style={styles.rowSub}>Manage SOS recipients</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      </Section>

      <Section title="Data">
        <Pressable onPress={clearRights} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Clear Rights chat history</Text>
            <Text style={styles.rowSub}>Delete saved Q&A from device</Text>
          </View>
          <Text style={[styles.chev, { color: colors.sindoor }]}>✕</Text>
        </Pressable>
      </Section>

      <Section title="AI Usage">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Calls (last 30d)</Text>
            <Text style={[styles.rowSub, { fontFamily: fonts.mono, color: colors.indigo }]}>{aiStats.total} requests</Text>
          </View>
        </View>
        {Object.keys(aiStats.avgByEndpoint).map((ep) => (
          <View key={ep} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{ep}</Text>
              <Text style={[styles.rowSub, { fontFamily: fonts.mono, color: colors.indigo }]}>
                avg {Math.round(aiStats.avgByEndpoint[ep])}ms · {aiStats.countByEndpoint[ep]} calls
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Error rate</Text>
            <Text style={[styles.rowSub, { fontFamily: fonts.mono, color: colors.indigo }]}>{(aiStats.errorRate * 100).toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Storage</Text>
            <Text style={[styles.rowSub, { fontFamily: fonts.mono, color: colors.indigo }]}>
              vault: {vaultCount} items · semcache: {(semSize / 1024).toFixed(1)} KB
            </Text>
          </View>
        </View>
        <Pressable onPress={onClearSemcache} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Clear AI cache</Text>
            <Text style={styles.rowSub}>Wipe semantic response cache</Text>
          </View>
          <Text style={[styles.chev, { color: colors.sindoor }]}>✕</Text>
        </Pressable>
        <Pressable onPress={onClearTelemetry} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Clear AI telemetry</Text>
            <Text style={styles.rowSub}>Wipe latency / error history</Text>
          </View>
          <Text style={[styles.chev, { color: colors.sindoor }]}>✕</Text>
        </Pressable>
      </Section>

      <Section title="About">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Saheli</Text>
            <Text style={styles.rowSub}>v1.0.0 · WitchHunt 2026</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Source</Text>
            <Text style={styles.rowSub}>github.com/your-org/saheli</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Available covers</Text>
            <Text style={styles.rowSub}>
              {COVERS.map((c) => c.name).join(' · ')}
            </Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

/** Aggregate telemetry rows: total, avg latency by endpoint, error rate. */
function computeTelemetryStats(entries: TelemetryEntry[]) {
  const cutoff = Date.now() - 30 * 86400_000;
  const recent = entries.filter((e) => e.ts >= cutoff);
  const total = recent.length;
  const sumByEndpoint: Record<string, number> = {};
  const countByEndpoint: Record<string, number> = {};
  let errors = 0;
  for (const e of recent) {
    sumByEndpoint[e.endpoint] = (sumByEndpoint[e.endpoint] ?? 0) + e.latencyMs;
    countByEndpoint[e.endpoint] = (countByEndpoint[e.endpoint] ?? 0) + 1;
    if (!e.ok) errors++;
  }
  const avgByEndpoint: Record<string, number> = {};
  for (const k of Object.keys(sumByEndpoint)) {
    avgByEndpoint[k] = sumByEndpoint[k] / countByEndpoint[k];
  }
  return {
    total,
    avgByEndpoint,
    countByEndpoint,
    errorRate: total === 0 ? 0 : errors / total,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.section}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleHi: { ...typography.h1, fontSize: 28 },
  titleEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.taupe,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  section: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(28, 36, 84, 0.1)',
  },
  privacyRow: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.cream,
  },
  privacyHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 20,
    color: colors.indigo,
    lineHeight: 26,
  },
  privacyEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.taupe,
    marginTop: 2,
  },
  privacyExplain: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkTeal,
    marginTop: spacing.sm,
  },
  rowTitle: {
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
    color: colors.indigo,
    lineHeight: 22,
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.taupe,
    marginTop: 2,
    lineHeight: 16,
  },
  chev: {
    color: colors.taupe,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
  },
});
