import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// "Last opened lesson" store, ported from the reference. Drives Home's continue
// card. Like completion, this is a signed-in benefit — guests read null and the
// write is gated at the call site (LessonReader) on the signed-in user.
const KEY = 'mrn.lastLesson';

export type LastLesson = {
  lessonId: number;
  moduleId: number;
  lessonTitle: string;
  moduleTitle?: string | null;
  // 1-based lesson position within the module (e.g. "L03").
  lessonNumber?: number;
  // Total lessons in the module (denominator of "3/8").
  totalLessons?: number;
  // Module number for display as "M02".
  moduleNumber?: number;
  updatedAt: number;
};

let cache: LastLesson | null | undefined;
const listeners = new Set<(v: LastLesson | null) => void>();

async function read(): Promise<LastLesson | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LastLesson; } catch { return null; }
}

async function load(): Promise<LastLesson | null> {
  if (cache === undefined) cache = await read();
  return cache ?? null;
}

function broadcast(v: LastLesson | null) {
  cache = v;
  listeners.forEach((l) => l(v));
}

export async function setLastLesson(v: LastLesson) {
  await AsyncStorage.setItem(KEY, JSON.stringify(v));
  broadcast(v);
}

export async function clearLastLesson() {
  await AsyncStorage.removeItem(KEY);
  broadcast(null);
}

export function useLastLesson() {
  const { user } = useAuth();
  const signedIn = !!user;
  const [value, setValue] = useState<LastLesson | null | undefined>(cache);
  useEffect(() => {
    if (!signedIn) return;
    if (cache === undefined) load().then((v) => setValue(v));
    const l = (v: LastLesson | null) => setValue(v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [signedIn]);
  const update = useCallback(setLastLesson, []);
  const clear = useCallback(clearLastLesson, []);
  const lastLesson = signedIn ? (value === undefined ? null : value) : null;
  return { lastLesson, setLastLesson: update, clearLastLesson: clear };
}
