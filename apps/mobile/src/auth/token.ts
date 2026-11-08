import * as SecureStore from "expo-secure-store";

const KEY = "sessionToken";
let cached: string | null = null;   

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveToken(token: string) {
  cached = token;
  await SecureStore.setItemAsync(KEY, token, options);
}

export async function getToken(): Promise<string | null> {
  if (cached) return cached;
  cached = await SecureStore.getItemAsync(KEY, options);
  return cached;
}

export async function clearToken() {
  cached = null;
  await SecureStore.deleteItemAsync(KEY, options);
}