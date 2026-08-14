import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SERVER_URL_KEY = 'lipi.server-url';
const API_TOKEN_KEY = 'lipi.api-token';

function webStorage() {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') return null;
  return globalThis.localStorage;
}

async function getValue(key: string) {
  const storage = webStorage();
  if (storage) return storage.getItem(key);
  if (await SecureStore.isAvailableAsync()) return SecureStore.getItemAsync(key);
  return null;
}

async function setValue(key: string, value: string) {
  const storage = webStorage();
  if (storage) {
    if (value) storage.setItem(key, value); else storage.removeItem(key);
    return;
  }
  if (!(await SecureStore.isAvailableAsync())) throw new Error('Secure settings are unavailable on this device');
  if (value) await SecureStore.setItemAsync(key, value); else await SecureStore.deleteItemAsync(key);
}

export async function getServerConfig() {
  const configuredUrl = await getValue(SERVER_URL_KEY);
  const apiToken = await getValue(API_TOKEN_KEY);
  const defaultUrl = process.env.EXPO_PUBLIC_LIPI_API_URL ?? '';
  return { serverUrl: (configuredUrl || defaultUrl).replace(/\/$/, ''), apiToken: apiToken ?? '' };
}

export async function saveServerConfig(serverUrl: string, apiToken: string) {
  const normalized = serverUrl.trim().replace(/\/$/, '');
  if (normalized && !/^https?:\/\//i.test(normalized)) throw new Error('Server URL must begin with http:// or https://');
  await Promise.all([setValue(SERVER_URL_KEY, normalized), setValue(API_TOKEN_KEY, apiToken.trim())]);
}

export async function authorizedFetch(path: string, init: RequestInit = {}) {
  const { serverUrl, apiToken } = await getServerConfig();
  if (!serverUrl) throw new Error('Add your Lipi server URL in Profile → Cloud & AI');
  const headers = new Headers(init.headers);
  if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${serverUrl}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Server returned ${response.status}`);
  return body;
}
