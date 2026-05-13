import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { MicIcon, VolumeOnIcon, VolumeOffIcon } from '../../src/components/icons';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import * as sarvam from '../../src/services/sarvam';
import { QUICK_QUESTIONS } from '../../src/data/rights';
import { askRights, type AskRightsResult } from '../../src/services/aiPipeline';
import type { RightsDoc } from '../../src/data/rights';
import type { FindOscResult, SchemeMatch } from '../../src/services/tools';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';

type ToolResult = { name: string; result: unknown };

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUri?: string | null;
  retrievedDocs?: RightsDoc[];
  fromCache?: boolean;
  guardrailFlagged?: boolean;
  toolResults?: ToolResult[];
};

const HISTORY_KEY = 'saheli.rights.history';
const AUTOPLAY_KEY = 'saheli.rights.autoplay';

export default function RightsScreen() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [autoplay, setAutoplay] = useState(false); // default OFF — stealth-safe
  const playingRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Pre-request mic permission on screen mount so the first tap doesn't race
  // with the system permission dialog (which interrupts the gesture).
  useEffect(() => {
    Audio.requestPermissionsAsync().catch(() => {});
  }, []);

  // Load persisted history + autoplay pref
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const arr = JSON.parse(raw) as Msg[];
          if (Array.isArray(arr)) setHistory(arr);
        } catch {}
      })
      .catch(() => {});
    AsyncStorage.getItem(AUTOPLAY_KEY)
      .then((raw) => {
        if (raw === '1') setAutoplay(true);
      })
      .catch(() => {});
    return () => {
      playingRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((prev) => {
      const next = !prev;
      AsyncStorage.setItem(AUTOPLAY_KEY, next ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  const persist = useCallback((next: Msg[]) => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const playAudio = useCallback(async (uri: string) => {
    try {
      await playingRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      playingRef.current = sound;
    } catch (e) {
      console.warn('[rights.play]', e);
    }
  }, []);

  const askQuestion = useCallback(
    async (questionText: string) => {
      const q = questionText.trim();
      if (!q) return;
      const userMsg: Msg = { id: newId(), role: 'user', text: q };
      const baseHistory = [...history, userMsg];
      setHistory(baseHistory);
      persist(baseHistory);
      setBusy(true);
      setBusyLabel('सोच रही हूँ…');
      try {
        // Stream tokens into a placeholder assistant bubble for live feel.
        const placeholderId = newId();
        let streamed = '';
        setHistory((h) => [
          ...h,
          { id: placeholderId, role: 'assistant', text: '' },
        ]);
        const result: AskRightsResult = await askRights(
          q,
          baseHistory.map((m) => ({ role: m.role, text: m.text })),
          (delta) => {
            streamed += delta;
            setHistory((h) =>
              h.map((m) => (m.id === placeholderId ? { ...m, text: streamed } : m))
            );
          }
        );
        const replyText =
          result.text ||
          'माफ़ कीजिए, अभी जवाब नहीं मिल पाया। कृपया NALSA helpline 15100 से संपर्क करें।';
        setBusyLabel('आवाज़ बना रही हूँ…');
        const audioUri = await sarvam.tts(replyText, 'hi-IN');
        const aMsg: Msg = {
          id: placeholderId,
          role: 'assistant',
          text: replyText,
          audioUri: audioUri ?? null,
          retrievedDocs: result.retrievedDocs,
          fromCache: result.fromCache,
          guardrailFlagged: result.guardrailFlagged,
          toolResults: result.toolResults,
        };
        const next = [...baseHistory, aMsg];
        setHistory(next);
        persist(next);
        if (audioUri && autoplay) playAudio(audioUri);
      } catch (e) {
        Alert.alert('Error', String(e));
      } finally {
        setBusy(false);
        setBusyLabel('');
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      }
    },
    [history, persist, playAudio, autoplay]
  );

  const startRec = async () => {
    try {
      console.log('[REC rights] start request');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('अनुमति चाहिए', 'माइक की अनुमति दें / Microphone permission is required.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      console.log('[REC rights] started');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      console.warn('[REC rights] start error', e);
      Alert.alert('Error', String(e));
    }
  };

  const stopRecAndAsk = async () => {
    if (!recording) return;
    setBusy(true);
    setBusyLabel('सुन रही हूँ…');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('[REC rights] stop uri:', uri);
      setRecording(null);
      if (!uri) {
        setBusy(false);
        return;
      }
      const transcript = await sarvam.stt(uri, { language: 'hi-IN' });
      if (!transcript.trim()) {
        Alert.alert('कुछ सुनाई नहीं दिया', 'कृपया दोबारा कोशिश करें।');
        setBusy(false);
        setBusyLabel('');
        return;
      }
      // askQuestion will set busy true again — turn it off briefly
      setBusy(false);
      await askQuestion(transcript);
    } catch (e) {
      Alert.alert('Error', String(e));
      setBusy(false);
      setBusyLabel('');
    }
  };

  const clearChat = () => {
    Alert.alert('Clear chat?', 'सारी बातचीत मिट जाएगी।', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setHistory([]);
          await AsyncStorage.removeItem(HISTORY_KEY);
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleHi}>अधिकार</Text>
          <Text style={styles.titleEn}>Know your rights</Text>
        </View>
        <Pressable
          onPress={toggleAutoplay}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoplay }}
          accessibilityLabel={`Voice playback ${autoplay ? 'on' : 'off'}`}
          style={[styles.voiceToggle, autoplay && styles.voiceToggleOn]}
        >
          {autoplay ? (
            <VolumeOnIcon size={16} color={colors.indigo} />
          ) : (
            <VolumeOffIcon size={16} color={colors.indigo} />
          )}
          <Text style={styles.voiceToggleTxt}>
            {autoplay ? 'Voice: On' : 'Voice: Off'}
          </Text>
        </Pressable>
        <QuickExitButton />
      </View>
      <Text style={styles.voiceCaption}>
        सुरक्षित जगह पर ही चालू करें · Only enable in a safe space
      </Text>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}
      >
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>नमस्ते बहन</Text>
            <Text style={styles.emptyBody}>
              माइक दबाकर अपना सवाल हिंदी में पूछें, या नीचे से एक चुनें।
            </Text>
          </View>
        ) : (
          history.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <View style={styles.bubbleHeaderRow}>
                <Text style={styles.bubbleRole}>
                  {m.role === 'user' ? 'आप' : 'सहेली'}
                </Text>
                {m.role === 'assistant' && m.fromCache ? (
                  <View style={styles.cacheBadge}>
                    <Text style={styles.cacheBadgeTxt}>cached</Text>
                  </View>
                ) : null}
              </View>
              {m.role === 'assistant' && m.retrievedDocs && m.retrievedDocs.length > 0 ? (
                <View style={styles.sourceRow}>
                  {m.retrievedDocs.map((d) => (
                    <View key={d.id} style={styles.sourceChip}>
                      <Text style={styles.sourceChipTxt}>{shortDocLabel(d)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={[styles.bubbleText, m.role === 'user' && { color: colors.cream }]}>{m.text}</Text>
              {m.role === 'assistant' && m.toolResults
                ? m.toolResults.map((tr, i) => (
                    <ToolResultCard key={`${m.id}-tr-${i}`} tr={tr} />
                  ))
                : null}
              {m.role === 'assistant' && m.audioUri ? (
                <Pressable
                  onPress={() => playAudio(m.audioUri!)}
                  style={styles.replayBtn}
                >
                  <Text style={styles.replayTxt}>▶ फिर सुनें</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.indigo} />
            <Text style={styles.busyTxt}>{busyLabel}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.suggestions}>
        {QUICK_QUESTIONS.map((q) => (
          <Pressable
            key={q.hi}
            disabled={busy || !!recording}
            onPress={() => askQuestion(q.hi)}
            style={({ pressed }) => [
              styles.chip,
              (busy || !!recording) && { opacity: 0.5 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.chipTxt}>{q.hi}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.micRow}>
        <Pressable
          onPress={() => {
            if (busy) return;
            if (recording) {
              stopRecAndAsk();
            } else {
              startRec();
            }
          }}
          disabled={busy}
          style={({ pressed }) => [
            styles.mic,
            recording && styles.micRec,
            (pressed || recording) && { transform: [{ scale: 1.04 }] },
            busy && { opacity: 0.5 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MicIcon size={20} color={colors.cream} />
            <Text style={styles.micTxt}>
              {recording ? 'सुन रही हूँ — फिर दबाएँ' : 'दबाकर बोलें'}
            </Text>
          </View>
        </Pressable>
        {history.length > 0 ? (
          <Pressable onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearTxt}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.disclaimer}>
        यह कानूनी सलाह नहीं है। नज़दीकी NALSA या OSC से संपर्क करें।
      </Text>
    </SafeAreaView>
  );
}

function shortDocLabel(d: RightsDoc): string {
  switch (d.id) {
    case 'pwdva': return 'PWDVA 2005';
    case 'ipc498a': return 'IPC 498A';
    case 'posh': return 'POSH 2013';
    case 'succession': return 'Succession 2005';
    case 's125crpc': return 'S.125 CrPC';
    case 'custody': return 'Custody';
    case 'nalsa': return 'NALSA';
    case 'fir': return 'FIR';
    case 'helplines': return 'Helplines';
    default: return d.id;
  }
}

function ToolResultCard({ tr }: { tr: ToolResult }) {
  if (tr.name === 'find_nearest_osc') {
    const list = (Array.isArray(tr.result) ? tr.result : []) as FindOscResult[];
    return (
      <View style={styles.toolCard}>
        <Text style={styles.toolHeader}>नज़दीकी One-Stop Centre</Text>
        {list.map((o, i) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(`tel:${o.phone}`).catch(() => {})}
            style={styles.toolRow}
          >
            <Text style={styles.toolRowName}>{o.name}</Text>
            <Text style={styles.toolRowSub}>{o.district} · ☎ {o.phone}</Text>
          </Pressable>
        ))}
      </View>
    );
  }
  if (tr.name === 'draft_zero_fir') {
    const txt = typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result);
    return (
      <View style={styles.toolCard}>
        <Text style={styles.toolHeader}>Zero-FIR टेम्पलेट</Text>
        <Text style={styles.toolBody}>{txt}</Text>
        <Pressable
          onPress={() => {
            Share.share({ message: txt }).catch(() => {});
          }}
          style={styles.toolBtn}
        >
          <Text style={styles.toolBtnTxt}>Copy / Share FIR template</Text>
        </Pressable>
      </View>
    );
  }
  if (tr.name === 'compute_maintenance_eligibility') {
    const r = (tr.result ?? {}) as { eligible?: boolean; reasons?: string[]; skeleton?: string };
    return (
      <View style={styles.toolCard}>
        <Text style={styles.toolHeader}>
          भरण-पोषण: {r.eligible ? 'पात्रता संभावित' : 'जाँच आवश्यक'}
        </Text>
        {(r.reasons ?? []).map((reason, i) => (
          <Text key={i} style={styles.toolBody}>• {reason}</Text>
        ))}
        {r.skeleton ? <Text style={styles.toolBody}>{r.skeleton}</Text> : null}
      </View>
    );
  }
  if (tr.name === 'match_schemes') {
    const list = (Array.isArray(tr.result) ? tr.result : []) as SchemeMatch[];
    return (
      <View style={styles.toolCard}>
        <Text style={styles.toolHeader}>आपकी संभावित योजनाएँ</Text>
        {list.map((s, i) => (
          <View key={i} style={styles.toolRow}>
            <Text style={styles.toolRowName}>{s.nameHi}</Text>
            <Text style={styles.toolRowSub}>{s.benefit}</Text>
            <Pressable
              onPress={() => Linking.openURL(s.applyUrl).catch(() => {})}
              style={styles.toolBtnSmall}
            >
              <Text style={styles.toolBtnTxt}>और जानें ›</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomColor: 'rgba(28, 36, 84, 0.1)',
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  titleHi: { ...typography.h1, fontSize: 28 },
  titleEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.2)',
    backgroundColor: colors.creamSoft,
    marginRight: spacing.sm,
  },
  voiceToggleOn: { borderColor: colors.indigo, backgroundColor: colors.indigo },
  voiceToggleIcon: { fontSize: 11 },
  voiceToggleTxt: {
    color: colors.taupe,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  voiceCaption: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.taupe,
    paddingHorizontal: spacing.xl,
    paddingTop: 4,
    paddingBottom: spacing.xs,
  },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { ...typography.h1, color: colors.indigo, marginBottom: spacing.sm },
  emptyBody: {
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkTeal,
    textAlign: 'center',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    maxWidth: '92%',
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.indigo,
    borderColor: colors.indigo,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.creamSoft,
    borderColor: 'rgba(28, 36, 84, 0.1)',
    borderBottomLeftRadius: 4,
  },
  bubbleRole: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.taupe,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bubbleText: {
    fontFamily: fonts.hiDisplay,
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkTeal,
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cacheBadge: {
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  cacheBadgeTxt: {
    color: colors.taupe,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 36, 84, 0.08)',
  },
  sourceChip: {
    backgroundColor: 'transparent',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.18)',
  },
  sourceChipTxt: {
    color: colors.taupe,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  toolCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.indigo,
  },
  toolHeader: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  toolRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(28, 36, 84, 0.1)',
  },
  toolRowName: {
    fontFamily: fonts.hiDisplay,
    fontSize: 18,
    color: colors.indigo,
    lineHeight: 24,
  },
  toolRowSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkTeal,
    marginTop: 2,
  },
  toolBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkTeal,
    marginTop: 4,
  },
  toolBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.indigo,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  toolBtnSmall: {
    marginTop: 4,
    backgroundColor: colors.indigo,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  toolBtnTxt: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  replayBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.indigo,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  replayTxt: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  busyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
  },
  busyTxt: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.indigo,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 36, 84, 0.08)',
  },
  chip: {
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  chipTxt: {
    color: colors.indigo,
    fontFamily: fonts.hiDisplay,
    fontSize: 13,
  },
  micRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 36, 84, 0.08)',
  },
  mic: {
    flex: 1,
    backgroundColor: colors.indigo,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.indigo,
  },
  micRec: { backgroundColor: colors.indigoSoft, borderColor: colors.indigoSoft },
  micTxt: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  clearTxt: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  disclaimer: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    color: colors.taupe,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 11,
  },
});
