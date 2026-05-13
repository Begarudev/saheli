import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import { stt, chatText } from '../../src/services/sarvam';
import {
  SymptomEntry,
  loadSymptoms,
  addSymptom,
  deleteSymptom,
  loadEpds,
  saveEpds,
  loadPcos,
  savePcos,
  loadCervical,
  saveCervical,
  loadMeds,
  saveMeds,
  EpdsResult,
  PcosResult,
  CervicalResult,
  getDraft,
  saveDraft,
  clearDraft,
  type DraftKind,
  doctorInputHash,
  loadDoctorSummary,
  saveDoctorSummary,
} from '../../src/services/health';
import { EPDS, PCOS, CERVICAL } from '../../src/data/screenings';
import { loadProfile } from '../../src/services/profile';
import type { ProfileInput } from '../../src/data/schemes';

type Tab = 'symptoms' | 'screenings' | 'doctor';

export default function HealthScreen() {
  const [tab, setTab] = useState<Tab>('symptoms');
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>सेहत</Text>
          <Text style={styles.sub}>Private health journal</Text>
        </View>
        <QuickExitButton />
      </View>

      <View style={styles.tabs}>
        {(['symptoms', 'screenings', 'doctor'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'symptoms' ? 'लक्षण' : t === 'screenings' ? 'जाँच' : 'डॉक्टर कार्ड'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'symptoms' && <SymptomsTab />}
      {tab === 'screenings' && <ScreeningsTab />}
      {tab === 'doctor' && <DoctorCardTab />}
    </SafeAreaView>
  );
}

// Symptoms

function SymptomsTab() {
  const [items, setItems] = useState<SymptomEntry[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [pain, setPain] = useState(5);

  const refresh = useCallback(async () => setItems(await loadSymptoms()), []);
  useEffect(() => {
    refresh();
    Audio.requestPermissionsAsync().catch(() => {});
  }, [refresh]);

  const startRec = async () => {
    try {
      console.log('[REC health] start request');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('अनुमति चाहिए', 'माइक की अनुमति दें।');
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
      console.log('[REC health] started');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      console.warn('[REC health] start error', e);
      Alert.alert('Error', String(e));
    }
  };

  const stopRec = async () => {
    if (!recording) return;
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('[REC health] stop uri:', uri);
      setRecording(null);
      if (!uri) {
        setBusy(false);
        return;
      }
      const text = await stt(uri, { language: 'hi-IN' });
      setPendingTranscript(text || '(कोई आवाज़ नहीं समझी गई)');
      setPain(5);
    } catch (e) {
      console.warn(e);
    } finally {
      setBusy(false);
    }
  };

  const savePending = async () => {
    if (!pendingTranscript) return;
    await addSymptom({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      transcript: pendingTranscript,
      painScale: pain,
    });
    setPendingTranscript(null);
    refresh();
  };

  const onLongDelete = (id: string) => {
    Alert.alert('हटाएँ?', 'क्या आप यह प्रविष्टि हटाना चाहती हैं?', [
      { text: 'नहीं' },
      {
        text: 'हाँ',
        style: 'destructive',
        onPress: async () => {
          await deleteSymptom(id);
          refresh();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 64 }}>
      <Text style={styles.bodyText}>
        माइक दबाकर बोलें — आपकी आवाज़ केवल इस फ़ोन में सहेजी जाएगी।
      </Text>

      <Pressable
        style={[styles.micBtn, recording && styles.micBtnActive]}
        onPress={() => {
          if (busy) return;
          if (recording) stopRec();
          else startRec();
        }}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.cream} />
        ) : (
          <Text style={styles.micBtnText}>
            {recording ? 'सुन रही हूँ — फिर दबाएँ' : 'दबाकर बोलें'}
          </Text>
        )}
      </Pressable>

      {pendingTranscript && (
        <View style={styles.card}>
          <Text style={styles.label}>आपकी बात:</Text>
          <Text style={styles.bodyText}>{pendingTranscript}</Text>
          <Text style={[styles.label, { marginTop: spacing.md }]}>दर्द (1–10): {pain}</Text>
          <View style={styles.painRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable
                key={n}
                style={[styles.painCell, pain === n && styles.painCellActive]}
                onPress={() => setPain(n)}
              >
                <Text style={[styles.painNum, pain === n && styles.painNumActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <Pressable style={[styles.chip, styles.chipActive]} onPress={savePending}>
              <Text style={styles.chipTextActive}>सहेजें</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => setPendingTranscript(null)}>
              <Text style={styles.chipText}>रद्द करें</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={[styles.h2, { marginTop: spacing.lg }]}>पिछली प्रविष्टियाँ</Text>
      {items.length === 0 && <Text style={styles.muted}>अभी कुछ नहीं।</Text>}
      {items.map((it) => (
        <Pressable key={it.id} onLongPress={() => onLongDelete(it.id)} style={styles.entry}>
          <Text style={styles.entryTs}>
            {new Date(it.ts).toLocaleString('hi-IN')} · दर्द {it.painScale}/10
          </Text>
          <Text style={styles.bodyText}>{it.transcript}</Text>
        </Pressable>
      ))}
      <Text style={styles.muted}>लंबा दबाकर हटाएँ</Text>
    </ScrollView>
  );
}

// Screenings

function ScreeningsTab() {
  const [epds, setEpds] = useState<EpdsResult | null>(null);
  const [pcos, setPcos] = useState<PcosResult | null>(null);
  const [cerv, setCerv] = useState<CervicalResult | null>(null);
  const [active, setActive] = useState<null | 'epds' | 'pcos' | 'cervical'>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<number, number>>({});

  const refresh = useCallback(async () => {
    setEpds(await loadEpds());
    setPcos(await loadPcos());
    setCerv(await loadCervical());
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const STALE_MS = 24 * 60 * 60 * 1000;

  const startScreening = useCallback(async (kind: DraftKind) => {
    const draft = await getDraft(kind);
    const fresh = draft && Date.now() - draft.startedAt < STALE_MS && Object.keys(draft.answers).length > 0;
    if (fresh && draft) {
      Alert.alert(
        'अधूरा सवाल मिला',
        'क्या आप अधूरा सवाल जारी रखना चाहती हैं?',
        [
          {
            text: 'नया शुरू',
            style: 'destructive',
            onPress: async () => {
              await clearDraft(kind);
              setInitialAnswers({});
              setActive(kind);
            },
          },
          {
            text: 'जारी रखें',
            onPress: () => {
              setInitialAnswers(draft.answers);
              setActive(kind);
            },
          },
        ]
      );
    } else {
      if (draft) await clearDraft(kind);
      setInitialAnswers({});
      setActive(kind);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 64 }}>
      <ScreeningCard
        title="EPDS-10"
        titleHi="मानसिक स्वास्थ्य जाँच"
        desc="प्रसवोत्तर अवसाद जाँच (10 प्रश्न)"
        result={
          epds
            ? `${epds.score}/${epds.max} · ${new Date(epds.ts).toLocaleDateString('hi-IN')}`
            : null
        }
        banner={epdsBanner(epds?.score)}
        onStart={() => startScreening('epds')}
      />
      <ScreeningCard
        title="PCOS"
        titleHi="पीसीओएस जाँच"
        desc="हार्मोन/मासिक लक्षण (8 प्रश्न)"
        result={
          pcos
            ? `${pcos.score}/${pcos.total} · ${new Date(pcos.ts).toLocaleDateString('hi-IN')}`
            : null
        }
        banner={pcos && pcos.score >= 4 ? { color: colors.saffronDeep, text: 'PCOS जांच की सिफारिश' } : null}
        onStart={() => startScreening('pcos')}
      />
      <ScreeningCard
        title="Cervical Risk"
        titleHi="सर्वाइकल जोखिम जाँच"
        desc="6 प्रश्न"
        result={
          cerv
            ? `${cerv.score}/${cerv.total} · ${new Date(cerv.ts).toLocaleDateString('hi-IN')}`
            : null
        }
        banner={
          cerv && cerv.score >= 3
            ? { color: colors.danger, text: 'डॉक्टर से जल्दी मिलें' }
            : null
        }
        onStart={() => startScreening('cervical')}
      />

      {active === 'epds' && (
        <ScoredQuiz
          title="EPDS-10"
          kind="epds"
          questions={EPDS}
          initialAnswers={initialAnswers}
          onClose={() => setActive(null)}
          onDone={async (score) => {
            const r: EpdsResult = { ts: Date.now(), score, max: EPDS.length * 3 };
            await saveEpds(r);
            await clearDraft('epds');
            setActive(null);
            setInitialAnswers({});
            refresh();
          }}
        />
      )}
      {active === 'pcos' && (
        <YesNoQuiz
          title="PCOS जाँच"
          kind="pcos"
          questions={PCOS}
          initialAnswers={initialAnswers}
          onClose={() => setActive(null)}
          onDone={async (score) => {
            await savePcos({ ts: Date.now(), score, total: PCOS.length });
            await clearDraft('pcos');
            setActive(null);
            setInitialAnswers({});
            refresh();
          }}
        />
      )}
      {active === 'cervical' && (
        <YesNoQuiz
          title="सर्वाइकल जोखिम"
          kind="cervical"
          questions={CERVICAL}
          initialAnswers={initialAnswers}
          onClose={() => setActive(null)}
          onDone={async (score) => {
            await saveCervical({ ts: Date.now(), score, total: CERVICAL.length });
            await clearDraft('cervical');
            setActive(null);
            setInitialAnswers({});
            refresh();
          }}
        />
      )}
    </ScrollView>
  );
}

function epdsBanner(score: number | undefined) {
  if (score == null) return null;
  if (score >= 13) return { color: colors.danger, text: 'कृपया तुरंत डॉक्टर से मिलें' };
  if (score >= 10) return { color: colors.saffronDeep, text: 'कृपया डॉक्टर से मिलें' };
  return null;
}

function ScreeningCard({
  title,
  titleHi,
  desc,
  result,
  banner,
  onStart,
}: {
  title: string;
  titleHi: string;
  desc: string;
  result: string | null;
  banner: { color: string; text: string } | null;
  onStart: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardHi}>{titleHi}</Text>
      <Text style={styles.cardEn}>{title}</Text>
      <Text style={styles.bodyText}>{desc}</Text>
      {result && <Text style={[styles.muted, { marginTop: spacing.xs }]}>पिछला: {result}</Text>}
      {banner && (
        <View style={[styles.banner, { backgroundColor: banner.color }]}>
          <Text style={styles.bannerText}>{banner.text}</Text>
        </View>
      )}
      <Pressable style={[styles.startBtn]} onPress={onStart}>
        <Text style={styles.startBtnText}>{result ? 'फिर से शुरू करें' : 'शुरू करें'}</Text>
      </Pressable>
    </View>
  );
}

function ScoredQuiz({
  title,
  kind,
  questions,
  initialAnswers,
  onClose,
  onDone,
}: {
  title: string;
  kind: DraftKind;
  questions: typeof EPDS;
  initialAnswers: Record<number, number>;
  onClose: () => void;
  onDone: (score: number) => void;
}) {
  const initial = initialAnswers ?? {};
  // Resume at first unanswered question.
  const firstUnanswered = (() => {
    for (let i = 0; i < questions.length; i++) {
      if (initial[i] == null) return i;
    }
    return questions.length - 1;
  })();
  const [idx, setIdx] = useState(firstUnanswered);
  const [answers, setAnswers] = useState<Record<number, number>>(initial);
  const startedAtRef = useRef<number>(Date.now());
  const q = questions[idx];

  const select = (s: number) => {
    const nextAnswers = { ...answers, [idx]: s };
    setAnswers(nextAnswers);
    if (idx === questions.length - 1) {
      const total = Object.values(nextAnswers).reduce((a, b) => a + b, 0);
      onDone(total);
    } else {
      saveDraft(kind, { answers: nextAnswers, startedAt: startedAtRef.current }).catch(() => {});
      setIdx(idx + 1);
    }
  };
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={styles.modalHeader}>
          <Text style={styles.h2}>
            {title} ({idx + 1}/{questions.length})
          </Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>बंद</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.qText}>{q.q}</Text>
          {q.options.map((o, i) => (
            <Pressable key={i} style={styles.optBtn} onPress={() => select(o.score)}>
              <Text style={styles.optText}>{o.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function YesNoQuiz({
  title,
  kind,
  questions,
  initialAnswers,
  onClose,
  onDone,
}: {
  title: string;
  kind: DraftKind;
  questions: typeof PCOS;
  initialAnswers: Record<number, number>;
  onClose: () => void;
  onDone: (score: number) => void;
}) {
  const initial = initialAnswers ?? {};
  const firstUnanswered = (() => {
    for (let i = 0; i < questions.length; i++) {
      if (initial[i] == null) return i;
    }
    return questions.length - 1;
  })();
  const [idx, setIdx] = useState(firstUnanswered);
  const [answers, setAnswers] = useState<Record<number, number>>(initial);
  const startedAtRef = useRef<number>(Date.now());

  const select = (yes: boolean) => {
    const nextAnswers = { ...answers, [idx]: yes ? 1 : 0 };
    setAnswers(nextAnswers);
    if (idx === questions.length - 1) {
      const total = Object.values(nextAnswers).reduce((a, b) => a + b, 0);
      onDone(total);
    } else {
      saveDraft(kind, { answers: nextAnswers, startedAt: startedAtRef.current }).catch(() => {});
      setIdx(idx + 1);
    }
  };
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={styles.modalHeader}>
          <Text style={styles.h2}>
            {title} ({idx + 1}/{questions.length})
          </Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>बंद</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.qText}>{questions[idx].q}</Text>
          <Pressable style={styles.optBtn} onPress={() => select(true)}>
            <Text style={styles.optText}>हाँ</Text>
          </Pressable>
          <Pressable style={styles.optBtn} onPress={() => select(false)}>
            <Text style={styles.optText}>नहीं</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Doctor Card

function DoctorCardTab() {
  const [profile, setProfile] = useState<ProfileInput>({});
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [epds, setEpds] = useState<EpdsResult | null>(null);
  const [pcos, setPcos] = useState<PcosResult | null>(null);
  const [cerv, setCerv] = useState<CervicalResult | null>(null);
  const [meds, setMeds] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const refresh = useCallback(async () => {
    setProfile(await loadProfile());
    setSymptoms((await loadSymptoms()).slice(0, 10));
    setEpds(await loadEpds());
    setPcos(await loadPcos());
    setCerv(await loadCervical());
    setMeds(await loadMeds());
    const cached = await loadDoctorSummary();
    if (cached) setAiSummary(cached.text);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const buildSummaryInput = useCallback(() => {
    const last30d = symptoms.filter((s) => Date.now() - s.ts < 30 * 86400_000);
    return JSON.stringify({
      profile,
      meds,
      symptoms: last30d.map((s) => ({ ts: s.ts, t: s.transcript, p: s.painScale })),
      epds,
      pcos,
      cervical: cerv,
    });
  }, [profile, meds, symptoms, epds, pcos, cerv]);

  const generateSummary = useCallback(
    async (force = false) => {
      const input = buildSummaryInput();
      const hash = doctorInputHash(input);
      if (!force) {
        const cached = await loadDoctorSummary();
        if (cached && cached.hash === hash) {
          setAiSummary(cached.text);
          return;
        }
      }
      setAiBusy(true);
      try {
        const text = await chatText([
          {
            role: 'system',
            content:
              'You are a clinical assistant. Summarize the patient health journal for a Hindi-speaking GP in 3 bullet points covering: (1) pattern of symptoms, (2) screening flags, (3) suggested investigations. Output plain Hindi text, max 80 words. No disclaimers.',
          },
          { role: 'user', content: `Patient data: ${input}` },
        ]);
        const finalText = text || '(सारांश उपलब्ध नहीं)';
        setAiSummary(finalText);
        await saveDoctorSummary({ hash, text: finalText, ts: Date.now() });
      } finally {
        setAiBusy(false);
      }
    },
    [buildSummaryInput]
  );

  // Auto-generate once when the card is first opened with data, if no cached summary.
  useEffect(() => {
    if (aiSummary || aiBusy) return;
    if (symptoms.length === 0 && !epds && !pcos && !cerv) return;
    generateSummary(false).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symptoms.length, epds, pcos, cerv]);

  const onMedsChange = (s: string) => {
    setMeds(s);
    saveMeds(s).catch(() => {});
  };

  const buildText = () => {
    const lines: string[] = [];
    const today = new Date().toLocaleDateString('hi-IN');
    lines.push(`Saheli Doctor Card — ${today}`);
    lines.push('');
    lines.push('— बुनियादी जानकारी —');
    if (profile.age != null) lines.push(`आयु: ${profile.age}`);
    if (profile.state) lines.push(`राज्य: ${profile.state}`);
    if (profile.category) lines.push(`श्रेणी: ${profile.category}`);
    if (profile.pregnantOrLactating) lines.push('गर्भवती/स्तनपान: हाँ');
    lines.push('');
    lines.push('— वर्तमान दवाएँ —');
    lines.push(meds || '(कोई नहीं)');
    lines.push('');
    lines.push('— जाँच परिणाम —');
    if (epds) lines.push(`EPDS-10: ${epds.score}/${epds.max} (${new Date(epds.ts).toLocaleDateString('hi-IN')})`);
    if (pcos) lines.push(`PCOS: ${pcos.score}/${pcos.total} (${new Date(pcos.ts).toLocaleDateString('hi-IN')})`);
    if (cerv) lines.push(`Cervical: ${cerv.score}/${cerv.total} (${new Date(cerv.ts).toLocaleDateString('hi-IN')})`);
    if (!epds && !pcos && !cerv) lines.push('(कोई जाँच नहीं)');
    lines.push('');
    lines.push('— हाल के लक्षण (10 तक) —');
    if (symptoms.length === 0) lines.push('(कोई नहीं)');
    for (const s of symptoms) {
      lines.push(
        `• ${new Date(s.ts).toLocaleString('hi-IN')} · दर्द ${s.painScale}/10 — ${s.transcript}`
      );
    }
    return lines.join('\n');
  };

  const onShare = async () => {
    try {
      await Share.share({ message: buildText() });
    } catch (e) {
      console.warn('[health.share]', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 64 }}>
      <View style={styles.doctorCard}>
        <Text style={styles.docTitle}>Saheli Doctor Card</Text>
        <Text style={styles.docDate}>{new Date().toLocaleDateString('hi-IN')}</Text>

        <View style={styles.aiSummaryBox}>
          <View style={styles.aiSummaryHeader}>
            <Text style={styles.aiSummaryTitle}>AI सारांश</Text>
            <Pressable onPress={() => generateSummary(true)} disabled={aiBusy} style={styles.regenBtn}>
              <Text style={styles.regenBtnTxt}>{aiBusy ? '…' : 'फिर से'}</Text>
            </Pressable>
          </View>
          {aiBusy ? (
            <ActivityIndicator color={colors.indigo} style={{ marginVertical: 6 }} />
          ) : (
            <Text style={styles.aiSummaryText}>
              {aiSummary ?? '(सारांश तैयार करने के लिए ऊपर "फिर से" दबाएँ)'}
            </Text>
          )}
        </View>

        <Text style={styles.docSection}>बुनियादी जानकारी</Text>
        {profile.age != null && <Text style={styles.docLine}>आयु: {profile.age}</Text>}
        {profile.state && <Text style={styles.docLine}>राज्य: {profile.state}</Text>}
        {profile.category && <Text style={styles.docLine}>श्रेणी: {profile.category}</Text>}
        {profile.pregnantOrLactating && <Text style={styles.docLine}>गर्भवती/स्तनपान: हाँ</Text>}
        {profile.age == null && !profile.state && (
          <Text style={styles.docMuted}>(योजना टैब में जानकारी भरें)</Text>
        )}

        <Text style={styles.docSection}>वर्तमान दवाएँ</Text>
        <TextInput
          style={styles.medsInput}
          multiline
          placeholder="दवा का नाम, मात्रा, समय"
          placeholderTextColor={colors.taupe}
          value={meds}
          onChangeText={onMedsChange}
        />

        <Text style={styles.docSection}>जाँच परिणाम</Text>
        {epds && (
          <Text style={styles.docLine}>
            EPDS-10: {epds.score}/{epds.max} ({new Date(epds.ts).toLocaleDateString('hi-IN')})
          </Text>
        )}
        {pcos && (
          <Text style={styles.docLine}>
            PCOS: {pcos.score}/{pcos.total} ({new Date(pcos.ts).toLocaleDateString('hi-IN')})
          </Text>
        )}
        {cerv && (
          <Text style={styles.docLine}>
            Cervical: {cerv.score}/{cerv.total} ({new Date(cerv.ts).toLocaleDateString('hi-IN')})
          </Text>
        )}
        {!epds && !pcos && !cerv && <Text style={styles.docMuted}>(कोई जाँच नहीं)</Text>}

        <Text style={styles.docSection}>हाल के लक्षण</Text>
        {symptoms.length === 0 && <Text style={styles.docMuted}>(कोई नहीं)</Text>}
        {symptoms.map((s) => (
          <Text key={s.id} style={styles.docLine}>
            • {new Date(s.ts).toLocaleDateString('hi-IN')} · दर्द {s.painScale}/10 — {s.transcript}
          </Text>
        ))}
      </View>

      <Pressable style={styles.shareBtn} onPress={onShare}>
        <Text style={styles.shareBtnText}>साझा करें / सहेजें</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm,
    gap: spacing.md,
    borderBottomColor: 'rgba(28, 36, 84, 0.1)', borderBottomWidth: 1,
  },
  h1: { ...typography.h1, fontSize: 28 },
  h2: { ...typography.h2 },
  sub: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  bodyText: {
    fontFamily: fonts.hiDisplay,
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkTeal,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.taupe,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.taupe,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    padding: 4,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.indigo },
  tabText: {
    color: colors.taupe,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
  },

  micBtn: {
    backgroundColor: colors.indigo,
    padding: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  micBtnActive: { backgroundColor: colors.sindoor },
  micBtnText: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
  },

  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  cardHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 18,
    color: colors.indigo,
    lineHeight: 26,
  },
  cardEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.taupe,
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  painRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: 6 },
  painCell: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.creamSoft, borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  painCellActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  painNum: { color: colors.taupe, fontFamily: fonts.body, fontSize: 13 },
  painNumActive: { color: colors.cream, fontFamily: fonts.bodyBold },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    backgroundColor: colors.cream,
  },
  chipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.taupe, fontFamily: fonts.body, fontSize: 13 },
  chipTextActive: { color: colors.cream, fontFamily: fonts.bodyBold, fontSize: 13 },

  entry: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  entryTs: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.taupe,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  banner: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bannerText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  startBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.indigo,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomColor: 'rgba(28, 36, 84, 0.1)', borderBottomWidth: 1,
  },
  close: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  qText: { ...typography.h2, marginBottom: spacing.lg },
  optBtn: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  optText: { ...typography.body },

  doctorCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  docTitle: {
    fontFamily: fonts.hiDisplay,
    fontSize: 22,
    color: colors.indigo,
    lineHeight: 30,
  },
  docDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.taupe,
    marginBottom: spacing.md,
  },
  docSection: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.taupe,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 36, 84, 0.12)',
    paddingBottom: 4,
  },
  docLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkTeal,
    marginVertical: 2,
    lineHeight: 22,
  },
  aiSummaryBox: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.indigo,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  aiSummaryTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.indigo,
  },
  aiSummaryText: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    color: colors.indigo,
    lineHeight: 22,
  },
  regenBtn: {
    backgroundColor: colors.indigo,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  regenBtnTxt: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  docMuted: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.taupe,
    fontStyle: 'italic',
  },
  medsInput: {
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 60,
    color: colors.indigo,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: colors.creamSoft,
  },
  shareBtn: {
    backgroundColor: colors.indigo,
    padding: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  shareBtnText: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
  },
});
