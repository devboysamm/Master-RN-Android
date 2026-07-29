import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// On-device completion store, ported from the reference (single AsyncStorage
// key, module-level cache + listeners so every screen stays in sync). Per the
// Android handoff, progress is a signed-in benefit: guests never read or write,
// so their progress always reads as empty. Server-side sync is a later task.
const KEY = 'mrn.completed';

async function readSet(): Promise<Set<number>> {
  const raw = await AsyncStorage.getItem(KEY);
  return new Set(raw ? (JSON.parse(raw) as number[]) : []);
}
async function writeSet(set: Set<number>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

let cache: Set<number> | null = null;
const listeners = new Set<(s: Set<number>) => void>();

async function load(): Promise<Set<number>> {
  if (!cache) cache = await readSet();
  return cache;
}
function broadcast(s: Set<number>) {
  cache = s;
  listeners.forEach((l) => l(s));
}

export function useCompleted() {
  const { user } = useAuth();
  const signedIn = !!user;
  const [set, setSet] = useState<Set<number>>(() => cache || new Set());
  useEffect(() => {
    if (!signedIn) return;
    if (!cache) load().then((s) => setSet(new Set(s)));
    const l = (s: Set<number>) => setSet(new Set(s));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [signedIn]);
  const markCompleted = useCallback(async (id: number) => {
    if (!signedIn) return;
    const current = await load();
    const next = new Set(current); next.add(id);
    await writeSet(next); broadcast(next);
  }, [signedIn]);
  const unmark = useCallback(async (id: number) => {
    if (!signedIn) return;
    const current = await load();
    const next = new Set(current); next.delete(id);
    await writeSet(next); broadcast(next);
  }, [signedIn]);
  const isCompleted = useCallback((id: number) => signedIn && set.has(id), [set, signedIn]);
  return { completed: signedIn ? Array.from(set) : [], isCompleted, markCompleted, unmark };
}
