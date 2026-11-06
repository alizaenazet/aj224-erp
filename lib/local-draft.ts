// Local drafts of field forms on the device (UMM-12); every call tolerates
// blocked or full storage, so forms still work without a draft.

export function readDraft<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, values: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage full or blocked.
  }
}

export function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
