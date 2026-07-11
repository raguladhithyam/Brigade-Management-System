import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Home-page popup/announcement config. Stored as a single Firestore document at
 * `settings/homePopup`. The admin edits it; the public HomePage reads it and shows
 * a dialog when `enabled` is true and there is something to show.
 */
export interface HomePopup {
  enabled: boolean;
  title: string;
  message: string;
  imageUrl: string;
  buttonLabel: string;
  buttonUrl: string;
  /** epoch ms of the last save — also used to key per-version dismissal on the client. */
  updatedAt: number;
}

export const DEFAULT_POPUP: HomePopup = {
  enabled: false,
  title: '',
  message: '',
  imageUrl: '',
  buttonLabel: '',
  buttonUrl: '',
  updatedAt: 0,
};

const POPUP_REF = () => doc(db, 'settings', 'homePopup');

export async function loadPopup(): Promise<HomePopup> {
  const snap = await getDoc(POPUP_REF());
  if (!snap.exists()) return DEFAULT_POPUP;
  return { ...DEFAULT_POPUP, ...(snap.data() as Partial<HomePopup>) };
}

export async function savePopup(popup: Omit<HomePopup, 'updatedAt'>): Promise<HomePopup> {
  const payload: HomePopup = { ...popup, updatedAt: Date.now() };
  await setDoc(POPUP_REF(), payload);
  return payload;
}

/** True when the popup has content worth displaying. */
export function popupHasContent(p: HomePopup): boolean {
  return Boolean(p.title.trim() || p.message.trim() || p.imageUrl.trim());
}
