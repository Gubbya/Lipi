import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { AudioSource } from 'expo-audio';
import { getServerConfig } from './app-config';

const DOWNLOAD_FOLDER = 'lipi/lesson-audio/';
const INDEX_FILE = 'downloads.json';
export const MAX_LESSON_AUDIO_BYTES = 250 * 1024 * 1024;

export interface LessonDownloadState {
  complete: boolean;
  downloaded: number;
  total: number;
}

let downloadedIndexPromise: Promise<Set<string>> | null = null;

function normalizeAudioPath(value: string) {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || !/^[\p{L}\p{N}._/-]+$/u.test(normalized)) {
    throw new Error('Invalid lesson audio path');
  }
  return normalized;
}

function downloadRoot() {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return null;
  return `${FileSystem.documentDirectory}${DOWNLOAD_FOLDER}`;
}

function localUri(path: string) {
  const root = downloadRoot();
  return root ? `${root}${normalizeAudioPath(path)}` : null;
}

function indexUri() {
  const root = downloadRoot();
  return root ? `${root}${INDEX_FILE}` : null;
}

async function readDownloadedIndex() {
  const file = indexUri();
  if (!file) return new Set<string>();
  try {
    const value = JSON.parse(await FileSystem.readAsStringAsync(file)) as unknown;
    if (!Array.isArray(value)) return new Set<string>();
    return new Set(value.filter((item): item is string => typeof item === 'string').map(normalizeAudioPath));
  } catch {
    return new Set<string>();
  }
}

async function downloadedIndex() {
  downloadedIndexPromise ??= readDownloadedIndex();
  return downloadedIndexPromise;
}

async function saveDownloadedIndex(index: Set<string>) {
  const root = downloadRoot();
  const file = indexUri();
  if (!root || !file) return;
  await FileSystem.makeDirectoryAsync(root, { intermediates: true });
  await FileSystem.writeAsStringAsync(file, JSON.stringify([...index].sort()));
}

async function downloadedStorageBytes(index: Set<string>) {
  let bytes = 0;
  for (const path of index) {
    const uri = localUri(path);
    if (!uri) continue;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && !info.isDirectory) bytes += info.size;
  }
  return bytes;
}

async function assetBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_LIPI_ASSET_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;
  const { serverUrl } = await getServerConfig();
  return serverUrl ? `${serverUrl}/media/audio` : '';
}

function remoteUrl(baseUrl: string, path: string) {
  const encodedPath = normalizeAudioPath(path).split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/${encodedPath}`;
}

export function lessonDownloadsSupported() {
  return Platform.OS !== 'web' && Boolean(FileSystem.documentDirectory);
}

export async function getLessonDownloadState(paths: string[]): Promise<LessonDownloadState> {
  const uniquePaths = [...new Set(paths.map(normalizeAudioPath))];
  const index = await downloadedIndex();
  const downloaded = uniquePaths.filter((path) => index.has(path)).length;
  return { complete: uniquePaths.length > 0 && downloaded === uniquePaths.length, downloaded, total: uniquePaths.length };
}

export async function resolveDownloadedAudioSource(path: string): Promise<AudioSource | null> {
  const normalized = normalizeAudioPath(path);
  const index = await downloadedIndex();
  if (!index.has(normalized)) return null;
  const uri = localUri(normalized);
  if (!uri) return null;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return { uri };
  index.delete(normalized);
  await saveDownloadedIndex(index);
  return null;
}

export async function downloadLessonAudio(paths: string[], onProgress?: (completed: number, total: number) => void) {
  if (!lessonDownloadsSupported()) throw new Error('Offline lesson downloads are available in the Android and iOS apps.');
  const baseUrl = await assetBaseUrl();
  if (!baseUrl) throw new Error('Add the Lipi server URL in Profile → Cloud & AI before downloading lessons.');

  const uniquePaths = [...new Set(paths.map(normalizeAudioPath))];
  const index = await downloadedIndex();
  let storedBytes = await downloadedStorageBytes(index);
  let completed = 0;
  onProgress?.(completed, uniquePaths.length);

  for (const path of uniquePaths) {
    if (index.has(path)) {
      completed += 1;
      onProgress?.(completed, uniquePaths.length);
      continue;
    }
    const destination = localUri(path);
    if (!destination) throw new Error('Persistent lesson storage is unavailable.');
    const parent = destination.slice(0, destination.lastIndexOf('/') + 1);
    await FileSystem.makeDirectoryAsync(parent, { intermediates: true });
    const partial = `${destination}.download`;
    try {
      const result = await FileSystem.downloadAsync(remoteUrl(baseUrl, path), partial);
      if (result.status < 200 || result.status >= 300) throw new Error(`Audio server returned ${result.status}`);
      const partialInfo = await FileSystem.getInfoAsync(partial);
      const partialBytes = partialInfo.exists && !partialInfo.isDirectory ? partialInfo.size : 0;
      if (storedBytes + partialBytes > MAX_LESSON_AUDIO_BYTES) {
        throw new Error('The 250 MB lesson-audio limit is reached. Delete an offline lesson before downloading another.');
      }
      await FileSystem.deleteAsync(destination, { idempotent: true });
      await FileSystem.moveAsync({ from: partial, to: destination });
      index.add(path);
      storedBytes += partialBytes;
      await saveDownloadedIndex(index);
    } catch (error) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      throw error;
    }
    completed += 1;
    onProgress?.(completed, uniquePaths.length);
  }
  return getLessonDownloadState(uniquePaths);
}

export async function removeLessonAudio(paths: string[]) {
  const uniquePaths = [...new Set(paths.map(normalizeAudioPath))];
  const index = await downloadedIndex();
  for (const path of uniquePaths) {
    const uri = localUri(path);
    if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
    index.delete(path);
  }
  await saveDownloadedIndex(index);
  return getLessonDownloadState(uniquePaths);
}
