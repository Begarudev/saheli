import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import {
  TrustedContact,
  loadContacts,
  saveContacts,
  newContactId,
  normalisePhone,
  MAX_CONTACTS,
} from '../../src/services/contacts';
import { dispatchSOS } from '../../src/services/sos';
import { PencilIcon, TrashIcon, ContactsIcon, PhoneIcon, CheckIcon } from '../../src/components/icons';
import { HELPLINES } from '../../src/data/helplines';
import { OSCS } from '../../src/data/osc';

export default function SafetyScreen() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TrustedContact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [failMsg, setFailMsg] = useState('');
  const [sosBusy, setSosBusy] = useState(false);

  useEffect(() => {
    loadContacts().then(setContacts).catch(() => {});
  }, []);

  const persist = useCallback(async (next: TrustedContact[]) => {
    setContacts(next);
    await saveContacts(next);
  }, []);

  const openAdd = () => {
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert('Limit', `Only ${MAX_CONTACTS} trusted contacts allowed.`);
      return;
    }
    setEditing(null);
    setName('');
    setPhone('');
    setEditorOpen(true);
  };

  const openEdit = (c: TrustedContact) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setEditorOpen(true);
  };

  const saveContact = async () => {
    const cleanedPhone = normalisePhone(phone);
    const cleanedName = name.trim();
    if (!cleanedName || cleanedPhone.length < 7) {
      Alert.alert('Missing info', 'Name and a valid phone number are required.');
      return;
    }
    let next: TrustedContact[];
    if (editing) {
      next = contacts.map((c) =>
        c.id === editing.id ? { ...c, name: cleanedName, phone: cleanedPhone } : c
      );
    } else {
      next = [...contacts, { id: newContactId(), name: cleanedName, phone: cleanedPhone }];
    }
    await persist(next);
    setEditorOpen(false);
  };

  const deleteContact = async (id: string) => {
    await persist(contacts.filter((c) => c.id !== id));
  };

  const pickFromContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Contact access denied. Add manually instead.');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      const withPhone = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.length > 0
      );
      if (withPhone.length === 0) {
        Alert.alert('No contacts', 'No contacts with phone numbers found.');
        return;
      }
      // Show first 30 in an Alert action sheet style
      const slice = withPhone.slice(0, 30);
      Alert.alert(
        'Pick a contact',
        '',
        [
          ...slice.map((c) => ({
            text: `${c.name ?? 'Unknown'} · ${c.phoneNumbers?.[0]?.number ?? ''}`,
            onPress: () => {
              setName(c.name ?? '');
              setPhone(normalisePhone(c.phoneNumbers?.[0]?.number ?? ''));
              setEditing(null);
              setEditorOpen(true);
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const showFailure = (msg: string) => {
    setFailMsg(msg);
    setFailOpen(true);
    setTimeout(() => setFailOpen(false), 4000);
  };

  const onSOS = async () => {
    if (sosBusy) return;
    if (contacts.length === 0) {
      // Distinct failure haptic + banner — no contacts is a config failure
      // the user needs to fix before SOS will work.
      showFailure('कोई संपर्क नहीं — पहले trusted contact जोड़ें');
      // dispatchSOS itself plays the failure haptic for the no_contacts path,
      // but here we short-circuit to also show the inline banner.
      return;
    }
    setSosBusy(true);
    try {
      const res = await dispatchSOS({ silent: false });
      if (res.ok) {
        setConfirmOpen(true);
        setTimeout(() => setConfirmOpen(false), 3000);
      } else {
        showFailure('भेजने में समस्या हुई — फिर कोशिश करें');
      }
    } catch (e) {
      showFailure('भेजने में समस्या हुई — फिर कोशिश करें');
      console.warn('[safety.sos]', e);
    } finally {
      setSosBusy(false);
    }
  };

  const call = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleHi}>सुरक्षा</Text>
          <Text style={styles.titleEn}>Safety net · trusted contacts and helplines</Text>
        </View>
        <QuickExitButton />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}>
        <Pressable
          onPress={onSOS}
          disabled={sosBusy}
          style={({ pressed }) => [
            styles.sosBtn,
            pressed && { opacity: 0.85 },
            sosBusy && { opacity: 0.7 },
          ]}
        >
          {sosBusy ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <>
              <Text style={styles.sosTxt}>मदद भेजें</Text>
              <Text style={styles.sosSub}>SOS · sends location to trusted contacts</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>विश्वसनीय संपर्क · Trusted Contacts</Text>
        <Text style={typography.small}>
          Up to {MAX_CONTACTS}. Stored encrypted on this device only.
        </Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          {contacts.length === 0 ? (
            <Text style={[typography.small, { fontStyle: 'italic' }]}>कोई संपर्क नहीं जोड़ा।</Text>
          ) : (
            contacts.map((c) => (
              <View key={c.id} style={styles.contactCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={typography.small}>{c.phone}</Text>
                </View>
                <Pressable onPress={() => openEdit(c)} style={styles.smallBtn}>
                  <PencilIcon size={16} color={colors.inkTeal} />
                </Pressable>
                <Pressable
                  onPress={() => deleteContact(c.id)}
                  style={[styles.smallBtn, { backgroundColor: colors.sindoor }]}
                >
                  <TrashIcon size={16} color={colors.cream} />
                </Pressable>
              </View>
            ))
          )}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Pressable
              onPress={openAdd}
              disabled={contacts.length >= MAX_CONTACTS}
              style={[
                styles.actionBtn,
                contacts.length >= MAX_CONTACTS && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.actionTxt}>+ Manual</Text>
            </Pressable>
            <Pressable
              onPress={pickFromContacts}
              disabled={contacts.length >= MAX_CONTACTS}
              style={[
                styles.actionBtn,
                contacts.length >= MAX_CONTACTS && { opacity: 0.5 },
              ]}
            >
              <ContactsIcon size={16} color={colors.inkTeal} />
              <Text style={styles.actionTxt}>From Contacts</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>हेल्पलाइन · Helplines</Text>
        <View style={{ gap: spacing.sm }}>
          {HELPLINES.map((h) => (
            <Pressable key={h.id} onPress={() => call(h.number)} style={styles.helpCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpHi}>{h.hi}</Text>
                <Text style={typography.small}>{h.en}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <PhoneIcon size={16} color={colors.inkTeal} />
                <Text style={styles.helpNum}>{h.number}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send SAHELI to 56161 by SMS"
          onPress={() => Linking.openURL('sms:56161?body=SAHELI').catch(() => {})}
          style={({ pressed }) => [styles.smsCard, pressed && { opacity: 0.85 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.smsTitle}>SMS भी काम करता है · Works on feature phones too</Text>
            <Text style={styles.smsBody}>बिना इंटरनेट के? SAHELI को 56161 पर SMS भेजें।</Text>
          </View>
          <Text style={styles.smsCta}>Send › 56161</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>One-Stop Centres (Sakhi)</Text>
        <View style={{ gap: spacing.sm }}>
          {OSCS.map((o) => (
            <Pressable key={o.id} onPress={() => call(o.phone)} style={styles.helpCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpHi}>{o.name}</Text>
                <Text style={typography.small}>
                  {o.district}, {o.state}
                </Text>
              </View>
              <PhoneIcon size={16} color={colors.inkTeal} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Contact editor modal */}
      <Modal
        transparent
        visible={editorOpen}
        animationType="fade"
        onRequestClose={() => setEditorOpen(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={typography.h2}>{editing ? 'Edit Contact' : 'Add Contact'}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.taupe}
              style={styles.input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91…"
              placeholderTextColor={colors.taupe}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => setEditorOpen(false)} style={styles.modalBtn}>
                <Text style={styles.actionTxt}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveContact} style={[styles.modalBtn, { backgroundColor: colors.indigo }]}>
                <Text style={[styles.actionTxt, { color: colors.cream }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SOS confirm modal */}
      <Modal transparent visible={confirmOpen} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.confirmCard}>
            <CheckIcon size={48} color={colors.indigo} strokeWidth={2} />
            <Text style={styles.confirmTitle}>मदद भेज दी गई</Text>
            <Text style={typography.small}>SOS dispatched to {contacts.length} contact(s)</Text>
          </View>
        </View>
      </Modal>

      {/* Inline failure banner — distinct from success modal so the
          stressed user can immediately see "didn't go through" without
          dismissing a celebratory checkmark. */}
      {failOpen && (
        <View pointerEvents="none" style={styles.failBanner}>
          <Text style={styles.failIcon}>⚠</Text>
          <Text style={styles.failTxt}>{failMsg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
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
    gap: spacing.md,
  },
  titleHi: { ...typography.h1, fontSize: 28 },
  titleEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  sosBtn: {
    backgroundColor: colors.sindoor,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#a93630',
    marginBottom: spacing.lg,
  },
  sosTxt: {
    fontFamily: fonts.hiDisplay,
    fontSize: 28,
    color: colors.cream,
    lineHeight: 36,
  },
  sosSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.cream,
    opacity: 0.9,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: fonts.hiDisplay,
    fontSize: 22,
    lineHeight: 30,
    color: colors.indigo,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactName: {
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
    color: colors.indigo,
    lineHeight: 22,
  },
  smallBtn: {
    backgroundColor: colors.creamSoft,
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  smallTxt: { color: colors.indigo, fontSize: 16 },
  actionBtn: {
    flexGrow: 1,
    backgroundColor: colors.creamSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionTxt: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
  },
  helpHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
    color: colors.indigo,
    lineHeight: 22,
  },
  helpNum: {
    color: colors.indigo,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  smsCard: {
    marginTop: spacing.md,
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
  smsTitle: {
    color: colors.indigo,
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    lineHeight: 22,
  },
  smsBody: {
    color: colors.taupe,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  smsCta: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
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
    backgroundColor: colors.creamSoft,
    color: colors.indigo,
    fontFamily: fonts.body,
    fontSize: 15,
    padding: spacing.md,
    borderRadius: radius.md,
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
  confirmCard: {
    backgroundColor: colors.indigo,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    minWidth: 280,
  },
  checkmark: { fontSize: 56, color: colors.cream, fontFamily: fonts.hiDisplay },
  confirmTitle: { ...typography.h1, color: colors.cream, marginTop: spacing.sm },
  failBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.sindoor,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: '#a93630',
  },
  failIcon: { fontSize: 22, color: colors.cream },
  failTxt: {
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    lineHeight: 22,
    color: colors.cream,
    flex: 1,
  },
});
