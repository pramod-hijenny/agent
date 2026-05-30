import { useEffect, useState, useSyncExternalStore } from "react";
import type { IntroRequest, Permissions, Profile } from "./types";
import { DEFAULT_PERMISSIONS } from "./types";

const KEY_USER = "agentcircle:user";
const KEY_INTROS = "agentcircle:intros";
const KEY_AUTH = "agentcircle:auth";

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

export function getUser(): Profile | null {
  const profile = read<Profile | null>(KEY_USER, null);
  if (profile && !profile.community_id) return null;
  return profile;
}
export function setUser(p: Profile | null) {
  write(KEY_USER, p);
}
export function getAuth(): { email: string; token?: string } | null {
  return read(KEY_AUTH, null);
}
export function setAuth(a: { email: string; token?: string } | null) {
  write(KEY_AUTH, a);
}
export function getIntros(): IntroRequest[] {
  return read<IntroRequest[]>(KEY_INTROS, []);
}
export function setIntros(arr: IntroRequest[]) {
  write(KEY_INTROS, arr);
}

function useStore<T>(getter: () => T): T {
  const [snap, setSnap] = useState<T>(() => getter());
  useEffect(() => {
    setSnap(getter());
    return subscribe(() => setSnap(getter()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return snap;
}

export function useUser() {
  return useStore(getUser);
}
export function useAuthState() {
  return useStore(getAuth);
}
export function useIntros() {
  return useStore(getIntros);
}

export function updateUser(updater: (p: Profile) => Profile) {
  const u = getUser();
  if (!u) return;
  setUser(updater(u));
}

export function updatePermissions(updater: (p: Permissions) => Permissions) {
  updateUser((u) => ({ ...u, permissions: updater(u.permissions) }));
}

export function addIntro(intro: IntroRequest) {
  setIntros([intro, ...getIntros()]);
}

export function updateIntro(id: string, updater: (i: IntroRequest) => IntroRequest) {
  setIntros(getIntros().map((i) => (i.id === id ? updater(i) : i)));
}

export function makeDefaultPermissions(): Permissions {
  return { ...DEFAULT_PERMISSIONS };
}

// SSR-safe helper for the layout to know if onboarded
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
