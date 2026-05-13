// Evidence Vault storage. Items live in FileSystem.documentDirectory/vault/,
// metadata in AsyncStorage under 'saheli.vault.items'.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';

export type VaultKind = 'audio' | 'photo' | 'note' | 'sos';

export type VaultItem = {
  id: string;
  kind: VaultKind;
  createdAt: number;
  hash: string; // SHA-256 hex
  uri?: string; // for audio/photo
  text?: string; // for note
  lat?: number;
  lng?: number;
  // AI-pass additions:
  transcript?: string; // post-STT for audio captures
  transcriptEmbedding?: number[]; // for semantic search across vault items
};

const KEY = 'saheli.vault.items';
const DIR = `${FileSystem.documentDirectory}vault/`;

export async function ensureVaultDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
  } catch (e) {
    console.warn('[vault.ensureVaultDir]', e);
  }
}

export async function listItems(): Promise<VaultItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as VaultItem[];
    return arr.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function saveAll(items: VaultItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function addItem(item: VaultItem): Promise<void> {
  const all = await listItems();
  all.unshift(item);
  await saveAll(all);
}

/** Patch an existing vault item by id (e.g. async transcript writeback). */
export async function updateItem(id: string, patch: Partial<VaultItem>): Promise<void> {
  const all = await listItems();
  const next = all.map((it) => (it.id === id ? { ...it, ...patch, id: it.id } : it));
  await saveAll(next);
}

export async function deleteItem(id: string): Promise<void> {
  const all = await listItems();
  const target = all.find((i) => i.id === id);
  if (target?.uri) {
    try {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
    } catch (e) {
      console.warn('[vault.deleteItem]', e);
    }
  }
  await saveAll(all.filter((i) => i.id !== id));
}

export async function hashFile(uri: string): Promise<string> {
  // Read file as base64 then digest. expo-crypto supports digestStringAsync over strings.
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, b64);
}

export async function hashText(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

export async function getLocation(): Promise<{ lat?: number; lng?: number }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return {};
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (e) {
    console.warn('[vault.getLocation]', e);
    return {};
  }
}

export async function moveIntoVault(srcUri: string, ext: string): Promise<string> {
  await ensureVaultDir();
  const dst = `${DIR}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    await FileSystem.moveAsync({ from: srcUri, to: dst });
  } catch {
    // moveAsync can fail across different file systems; fall back to copy.
    await FileSystem.copyAsync({ from: srcUri, to: dst });
  }
  return dst;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function shortHash(h: string): string {
  return h.slice(0, 10) + '…' + h.slice(-6);
}
