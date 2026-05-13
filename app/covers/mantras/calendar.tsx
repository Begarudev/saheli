import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../src/theme';

const DAYS = [
  { date: '08 May', tithi: 'शुक्ल पंचमी', festival: 'वसंत पंचमी' },
  { date: '09 May', tithi: 'शुक्ल षष्ठी', festival: '—' },
  { date: '10 May', tithi: 'शुक्ल सप्तमी', festival: 'मातृ दिवस' },
  { date: '11 May', tithi: 'शुक्ल अष्टमी', festival: 'दुर्गाष्टमी' },
  { date: '12 May', tithi: 'शुक्ल नवमी', festival: '—' },
  { date: '13 May', tithi: 'शुक्ल दशमी', festival: 'मोहिनी एकादशी (कल)' },
  { date: '14 May', tithi: 'शुक्ल एकादशी', festival: 'मोहिनी एकादशी' },
];

export default function CalendarScreen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xl }}>
        <Text style={typography.h1}>पंचांग · Calendar</Text>
        <Text style={typography.small}>Upcoming days</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 32 }}>
        {DAYS.map((d) => (
          <View key={d.date} style={styles.row}>
            <Text style={styles.date}>{d.date}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tithi}>{d.tithi}</Text>
              <Text style={styles.fest}>{d.festival}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.lg,
  },
  date: { color: colors.saffron, fontWeight: '800', fontSize: 16, width: 70 },
  tithi: { color: colors.cream, fontSize: 15 },
  fest: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
