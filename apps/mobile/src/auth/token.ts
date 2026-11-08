import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "sessionToken";
const isWeb = Platform.OS === "web";
let cached: string | null = null;

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveToken(token: string) {
  cached = token;
  if (isWeb) localStorage.setItem(KEY, token);
  else await SecureStore.setItemAsync(KEY, token, options);
}

export async function getToken(): Promise<string | null> {
  if (cached) return cached;
  cached = isWeb ? localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY, options);
  return cached;
}

export async function clearToken() {
  cached = null;
  if (isWeb) localStorage.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY, options);
}