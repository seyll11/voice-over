import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { TtsModelId, UserStudioProfile, VoiceId, VoicePreset } from '../types';
import { STYLE_PRESETS } from '../data/voices';

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  isGuest: boolean;
  studioProfile: UserStudioProfile | null;
  voicePresets: VoicePreset[];
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUserStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  saveStudioPreferences: (prefs: {
    preferredVoice: VoiceId;
    voiceLocked: boolean;
    lockedStyle: string;
    preferredModel: TtsModelId;
  }) => Promise<void>;
  saveVoicePreset: (preset: {
    name: string;
    voiceId: VoiceId;
    stylePrompt: string;
    model: TtsModelId;
  }) => Promise<void>;
  removeVoicePreset: (presetId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [studioProfile, setStudioProfile] = useState<UserStudioProfile | null>(null);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsGuest(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load or bootstrap user studio profile & listen to saved voice presets when verified
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setStudioProfile(null);
      setVoicePresets([]);
      return;
    }

    let isCancelled = false;
    const userDocPath = `users/${user.uid}`;
    const userDocRef = doc(db, 'users', user.uid);

    const ensureProfile = async () => {
      try {
        const snap = await getDoc(userDocRef);
        if (isCancelled) return;

        if (snap.exists()) {
          const data = snap.data() as UserStudioProfile;
          setStudioProfile(data);
        } else {
          const safeName = (user.displayName || user.email?.split('@')[0] || 'Kreator Suara')
            .trim()
            .slice(0, 80);
          const initialProfile = {
            uid: user.uid,
            displayName: safeName,
            preferredVoice: 'Kore' as VoiceId,
            voiceLocked: false,
            lockedStyle: STYLE_PRESETS[0].prompt,
            preferredModel: 'gemini-3.8-flash-lite-tts' as TtsModelId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userDocRef, initialProfile);
          if (!isCancelled) {
            setStudioProfile({
              uid: user.uid,
              displayName: safeName,
              preferredVoice: 'Kore',
              voiceLocked: false,
              lockedStyle: STYLE_PRESETS[0].prompt,
              preferredModel: 'gemini-3.8-flash-lite-tts',
            });
          }
        }
      } catch (err) {
        console.warn('Studio profile sync notice:', err);
      }
    };

    ensureProfile();

    const presetsPath = `users/${user.uid}/voicePresets`;
    const presetsQuery = query(
      collection(db, 'users', user.uid, 'voicePresets'),
      where('ownerId', '==', user.uid)
    );

    const unsubPresets = onSnapshot(
      presetsQuery,
      (snapshot) => {
        const items: VoicePreset[] = [];
        snapshot.forEach((d) => {
          const raw = d.data();
          items.push({
            id: d.id,
            ownerId: raw.ownerId,
            name: raw.name,
            voiceId: raw.voiceId,
            stylePrompt: raw.stylePrompt,
            model: raw.model,
          });
        });
        setVoicePresets(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, presetsPath);
      }
    );

    return () => {
      isCancelled = true;
      unsubPresets();
    };
  }, [user, user?.emailVerified]);

  const enterGuestMode = () => setIsGuest(true);
  const exitGuestMode = () => setIsGuest(false);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const cleanName = name.trim().slice(0, 80);
    if (cleanName) {
      await updateProfile(cred.user, { displayName: cleanName });
    }
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send initial verification email:', e);
    }
    setUser({ ...cred.user } as User);
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshUserStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser({ ...refreshed } as User);
    return refreshed.emailVerified;
  };

  const logout = async () => {
    setIsGuest(false);
    await signOut(auth);
  };

  const saveStudioPreferences = async (prefs: {
    preferredVoice: VoiceId;
    voiceLocked: boolean;
    lockedStyle: string;
    preferredModel: TtsModelId;
  }) => {
    if (!user || !user.emailVerified) return;
    const path = `users/${user.uid}`;
    const ref = doc(db, 'users', user.uid);
    const cleanLockedStyle = (prefs.lockedStyle || '').slice(0, 500);
    try {
      await updateDoc(ref, {
        preferredVoice: prefs.preferredVoice.slice(0, 40),
        voiceLocked: Boolean(prefs.voiceLocked),
        lockedStyle: cleanLockedStyle,
        preferredModel: prefs.preferredModel,
        updatedAt: serverTimestamp(),
      });
      setStudioProfile((prev) =>
        prev
          ? {
              ...prev,
              preferredVoice: prefs.preferredVoice,
              voiceLocked: prefs.voiceLocked,
              lockedStyle: cleanLockedStyle,
              preferredModel: prefs.preferredModel,
            }
          : null
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const saveVoicePreset = async (preset: {
    name: string;
    voiceId: VoiceId;
    stylePrompt: string;
    model: TtsModelId;
  }) => {
    if (!user || !user.emailVerified) {
      throw new Error('Verifikasi email atau login Google terlebih dahulu untuk menyimpan preset ke akun.');
    }
    const presetId = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const path = `users/${user.uid}/voicePresets/${presetId}`;
    const ref = doc(db, 'users', user.uid, 'voicePresets', presetId);
    try {
      await setDoc(ref, {
        ownerId: user.uid,
        name: preset.name.trim().slice(0, 80),
        voiceId: preset.voiceId.slice(0, 40),
        stylePrompt: preset.stylePrompt.trim().slice(0, 500) || STYLE_PRESETS[0].prompt,
        model: preset.model,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const removeVoicePreset = async (presetId: string) => {
    if (!user || !user.emailVerified) return;
    const path = `users/${user.uid}/voicePresets/${presetId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'voicePresets', presetId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isGuest,
        studioProfile,
        voicePresets,
        enterGuestMode,
        exitGuestMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        refreshUserStatus,
        logout,
        saveStudioPreferences,
        saveVoicePreset,
        removeVoicePreset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
