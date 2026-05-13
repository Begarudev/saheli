// SOS dispatcher. Used by Safety Net screen and the cover-mode mala stealth
// gesture (5 rapid taps). No-op silently if no contacts configured.
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { loadContacts } from './contacts';
import { addItem, hashText, newId } from './vault';

export type SOSResult = {
  ok: boolean;
  reason?: 'no_contacts' | 'sms_unavailable' | 'error';
  sentTo: string[];
  message: string;
  lat?: number;
  lng?: number;
};

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/**
 * Three distinct haptic patterns so a stressed user knows what happened
 * without looking at the screen — critical for the silent stealth path.
 *
 * - sending: one Heavy bump. "I heard you." Fired immediately on dispatch.
 * - success: triple-pulse Success → Light → Light (80ms gaps). Premium "delivered".
 * - failure: Error → Heavy → Heavy (100ms gaps). Anxious double-thump, distinct.
 */
export async function playSosHaptic(kind: 'sending' | 'success' | 'failure'): Promise<void> {
  try {
    if (kind === 'sending') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    if (kind === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await sleep(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sleep(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    // failure
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await sleep(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sleep(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // haptics are best-effort
  }
}

async function quickLocation(): Promise<{ lat?: number; lng?: number; timedOut?: boolean }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return {};
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>((res) => setTimeout(() => res(null), 5000)),
    ]);
    if (!pos) return { timedOut: true };
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return {};
  }
}

export function buildSOSMessage(opts: { lat?: number; lng?: number; ts: number }): string {
  const stamp = new Date(opts.ts).toISOString();
  const loc =
    opts.lat != null && opts.lng != null
      ? `https://maps.google.com/?q=${opts.lat},${opts.lng}`
      : 'जगह उपलब्ध नहीं';
  return `मुझे मदद चाहिए। मेरी जगह: ${loc} — समय: ${stamp}`;
}

export async function dispatchSOS(opts?: { silent?: boolean }): Promise<SOSResult> {
  const ts = Date.now();

  // Fire "sending" haptic immediately so the user feels acknowledgement
  // before SMS/GPS work begins. This applies to both visible and stealth paths.
  playSosHaptic('sending');

  const contacts = await loadContacts();

  if (contacts.length === 0) {
    playSosHaptic('failure');
    return { ok: false, reason: 'no_contacts', sentTo: [], message: '' };
  }

  const loc = await quickLocation();
  const message = buildSOSMessage({ ...loc, ts });
  const numbers = contacts.map((c) => c.phone);

  let smsOk = false;
  try {
    const available = await SMS.isAvailableAsync();
    if (available) {
      // expo-sms opens composer; we still call it in parallel-style.
      // On Android with permission it can send directly via OEM behavior.
      await SMS.sendSMSAsync(numbers, message);
      smsOk = true;
    }
  } catch (e) {
    console.warn('[sos.sms]', e);
  }

  // Always log to vault as evidence. If this fails we still treat the
  // dispatch as successful — SMS is what matters; vault is bookkeeping.
  try {
    const h = await hashText(`${ts}::${message}`);
    await addItem({
      id: newId(),
      kind: 'sos',
      createdAt: ts,
      hash: h,
      text: message,
      lat: loc.lat,
      lng: loc.lng,
    });
  } catch (e) {
    console.warn('[sos.vault]', e);
  }

  if (smsOk) {
    playSosHaptic('success');
  } else {
    playSosHaptic('failure');
  }

  return {
    ok: smsOk,
    reason: smsOk ? undefined : 'sms_unavailable',
    sentTo: numbers,
    message,
    lat: loc.lat,
    lng: loc.lng,
  };
}
