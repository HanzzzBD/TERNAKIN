import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KUNCI_TOKEN = "tk_sesi";
const KUNCI_PERANGKAT = "tk_perangkat";

/** Token sesi disimpan terenkripsi (Android Keystore); tidak pernah di AsyncStorage biasa. */
export async function ambilToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KUNCI_TOKEN);
  } catch {
    return null;
  }
}

export async function simpanToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KUNCI_TOKEN, token);
}

export async function hapusToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KUNCI_TOKEN);
}

let perangkatIdCache: string | null = null;

/**
 * ID perangkat untuk mode tamu (sama seperti web): data tamu dipindahkan ke akun saat masuk.
 * Bukan rahasia, jadi cukup di AsyncStorage.
 */
export async function ambilPerangkatId(): Promise<string> {
  if (perangkatIdCache) return perangkatIdCache;
  let id = await AsyncStorage.getItem(KUNCI_PERANGKAT);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(KUNCI_PERANGKAT, id);
  }
  perangkatIdCache = id;
  return id;
}
