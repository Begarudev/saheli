import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import {
  VaultItem,
  addItem,
  deleteItem,
  getLocation,
  hashFile,
  hashText,
  listItems,
  moveIntoVault,
  newId,
  shortHash,
  updateItem,
} from '../../src/services/vault';
import { stt, embed } from '../../src/services/sarvam';
import { cosine } from '../../src/services/rag';
import { MicIcon, MapPinIcon, TrashIcon } from '../../src/components/icons';

export default function VaultScreen() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [playing, setPlaying] = useState<Audio.Sound | null>(null);
  const [search, setSearch] = useState('');
  const [searchEmbed, setSearchEmbed] = useState<number[] | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(await listItems());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        playing?.unloadAsync().catch(() => {});
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh])
  );

  useEffect(() => {
    return () => {
      playing?.unloadAsync().catch(() => {});
    };
  }, [playing]);

  const startRec = async () => {
    try {
      console.log('[REC vault] start request');
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
      console.log('[REC vault] started');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      console.warn('[REC vault] start error', e);
      Alert.alert('Error', String(e));
    }
  };

  const stopRec = async () => {
    if (!recording) return;
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('[REC vault] stop uri:', uri);
      setRecording(null);
      if (!uri) return;
      const dst = await moveIntoVault(uri, 'm4a');
      const [h, loc] = await Promise.all([hashFile(dst), getLocation()]);
      const itemId = newId();
      await addItem({
        id: itemId,
        kind: 'audio',
        createdAt: Date.now(),
        hash: h,
        uri: dst,
        lat: loc.lat,
        lng: loc.lng,
      });
      await refresh();
      // Async STT + embedding in the background — never block the user.
      (async () => {
        try {
          const transcript = await stt(dst, { language: 'hi-IN' });
          if (!transcript) return;
          let transcriptEmbedding: number[] | undefined;
          try {
            transcriptEmbedding = await embed(transcript);
          } catch {
            // ignore — we'll fall back to substring search.
          }
          await updateItem(itemId, { transcript, transcriptEmbedding });
          await refresh();
        } catch (e) {
          console.warn('[vault.bg-stt]', e);
        }
      })();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setBusy(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera permission is required.');
        return;
      }
      const r = await ImagePicker.launchCameraAsync({ quality: 0.7, exif: false });
      if (r.canceled || !r.assets?.[0]) return;
      setBusy(true);
      const src = r.assets[0].uri;
      const dst = await moveIntoVault(src, 'jpg');
      const [h, loc] = await Promise.all([hashFile(dst), getLocation()]);
      await addItem({
        id: newId(),
        kind: 'photo',
        createdAt: Date.now(),
        hash: h,
        uri: dst,
        lat: loc.lat,
        lng: loc.lng,
      });
      await refresh();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text) {
      setNoteOpen(false);
      return;
    }
    setBusy(true);
    try {
      const ts = Date.now();
      const loc = await getLocation();
      const h = await hashText(`${ts}::${text}`);
      await addItem({
        id: newId(),
        kind: 'note',
        createdAt: ts,
        hash: h,
        text,
        lat: loc.lat,
        lng: loc.lng,
      });
      setNoteText('');
      setNoteOpen(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const playAudio = async (uri: string) => {
    try {
      await playing?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setPlaying(sound);
    } catch (e) {
      Alert.alert('Cannot play', String(e));
    }
  };

  const onDelete = (item: VaultItem) => {
    Alert.alert('Delete?', 'This evidence will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          await refresh();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerHi}>सबूत तिजोरी</Text>
          <Text style={styles.headerEn}>
            Evidence vault · {items.length} item{items.length === 1 ? '' : 's'}
          </Text>
        </View>
        <QuickExitButton />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={recording ? stopRec : startRec}
          style={[styles.actionBtn, recording && styles.recBtn]}
        >
          <Text style={styles.actionTxt}>{recording ? 'रोकें / Stop' : 'रिकॉर्ड करें'}</Text>
        </Pressable>
        <Pressable onPress={capturePhoto} style={styles.actionBtn}>
          <Text style={styles.actionTxt}>तस्वीर लें</Text>
        </Pressable>
        <Pressable onPress={() => setNoteOpen(true)} style={styles.actionBtn}>
          <Text style={styles.actionTxt}>नोट जोड़ें</Text>
        </Pressable>
      </View>

      {busy && <ActivityIndicator color={colors.indigo} style={{ marginTop: 8 }} />}

      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={(s) => {
            setSearch(s);
            if (!s.trim()) {
              setSearchEmbed(null);
              return;
            }
            // Compute embedding off-thread; ignore errors.
            embed(s).then(setSearchEmbed).catch(() => setSearchEmbed(null));
          }}
          placeholder="खोजें / Search…"
          placeholderTextColor={colors.taupe}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filterItems(items, search, searchEmbed)}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>तिजोरी खाली है</Text>
            <Text style={typography.small}>Capture audio, a photo, or a note to start your evidence trail.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardKind}>
                {item.kind === 'audio' ? 'audio' : item.kind === 'photo' ? 'photo' : 'note'} ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              {item.text ? <Text style={styles.cardBody}>{item.text}</Text> : null}
              {item.transcript ? (
                <Pressable
                  onPress={() =>
                    setExpandedTranscript(
                      expandedTranscript === item.id ? null : item.id
                    )
                  }
                  style={styles.transcriptRow}
                >
                  <MicIcon size={14} color={colors.indigo} />
                  <Text style={styles.transcriptHint}>
                    {expandedTranscript === item.id ? 'छिपाएँ' : 'transcript देखें'}
                  </Text>
                </Pressable>
              ) : null}
              {expandedTranscript === item.id && item.transcript ? (
                <Text style={styles.transcriptText}>{item.transcript}</Text>
              ) : null}
              <Text style={styles.meta}>SHA-256: {shortHash(item.hash)}</Text>
              {item.lat != null && item.lng != null ? (
                <View style={styles.metaRow}>
                  <MapPinIcon size={12} color={colors.taupe} />
                  <Text style={styles.meta}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
                </View>
              ) : (
                <View style={styles.metaRow}>
                  <MapPinIcon size={12} color={colors.taupe} />
                  <Text style={styles.meta}>location unavailable</Text>
                </View>
              )}
            </View>
            <View style={{ gap: 6 }}>
              {item.kind === 'audio' && item.uri ? (
                <Pressable onPress={() => playAudio(item.uri!)} style={styles.smallBtn}>
                  <Text style={styles.smallTxt}>▶</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => onDelete(item)} style={[styles.smallBtn, { backgroundColor: colors.sindoor, borderColor: colors.sindoor }]}>
                <TrashIcon size={14} color={colors.cream} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={noteOpen} transparent animationType="fade" onRequestClose={() => setNoteOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={typography.h2}>नोट / Note</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              placeholder="यहाँ लिखें…"
              placeholderTextColor={colors.taupe}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => setNoteOpen(false)} style={styles.modalBtn}>
                <Text style={styles.actionTxt}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveNote} style={[styles.modalBtn, { backgroundColor: colors.indigo, borderColor: colors.indigo }]}>
                <Text style={[styles.actionTxt, { color: colors.cream }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function filterItems(
  items: VaultItem[],
  search: string,
  searchEmbed: number[] | null
): VaultItem[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  // Hybrid: substring match OR (if both have embeddings) cosine ≥ 0.55.
  return items.filter((it) => {
    const haystack = [it.text ?? '', it.transcript ?? ''].join(' ').toLowerCase();
    if (haystack.includes(q)) return true;
    if (searchEmbed && it.transcriptEmbedding) {
      return cosine(searchEmbed, it.transcriptEmbedding) >= 0.55;
    }
    return false;
  });
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerHi: { ...typography.h1, fontSize: 28 },
  headerEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  actionBtn: {
    backgroundColor: colors.creamSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    flexGrow: 1,
    alignItems: 'center',
  },
  recBtn: { backgroundColor: colors.sindoor, borderColor: colors.sindoor },
  actionTxt: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
    gap: spacing.md,
  },
  cardKind: {
    color: colors.taupe,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardBody: {
    fontFamily: fonts.hiDisplay,
    fontSize: 15,
    lineHeight: 22,
    color: colors.indigo,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.taupe,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  smallBtn: {
    backgroundColor: colors.creamSoft,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  smallTxt: { color: colors.indigo, fontSize: 16 },
  searchRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.creamSoft,
    color: colors.indigo,
    fontFamily: fonts.body,
    fontSize: 14,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  transcriptRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  transcriptHint: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  transcriptText: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    color: colors.inkTeal,
    marginTop: 4,
  },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyTxt: { ...typography.h2, marginBottom: spacing.sm },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(28, 36, 84, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.cream,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.2)',
    gap: spacing.md,
  },
  input: {
    minHeight: 120,
    backgroundColor: colors.creamSoft,
    color: colors.indigo,
    fontFamily: fonts.body,
    fontSize: 15,
    padding: spacing.md,
    borderRadius: radius.md,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  modalBtn: {
    backgroundColor: colors.creamSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
});
