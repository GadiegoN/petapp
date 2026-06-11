"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  or,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { profileFromFirestore } from "@/lib/firebase/profile-mapper";
import type { AuthenticatedProfile } from "@/types/domain";

type AuthContextValue = {
  user: User | null;
  profile: AuthenticatedProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthenticatedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);

    const userRef = doc(db, "users", user.uid);

    return onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDoc(userRef, {
            displayName: user.displayName ?? "",
            email: user.email ?? "",
            photoURL: user.photoURL ?? "",
            role: "public",
            organizationIds: [],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          }).catch(() => {
            setIsProfileLoading(false);
          });
          return;
        }

        const data = snapshot.data();
        if (data && data.isActive === false) {
          updateDoc(userRef, {
            isActive: true,
            updatedAt: serverTimestamp(),
          }).catch((err) => {
            console.error("Erro ao auto-ativar usuario:", err);
          });
        }

        setProfile(profileFromFirestore(snapshot.id, snapshot.data()));
        setIsProfileLoading(false);
      },
      () => {
        setProfile(null);
        setIsProfileLoading(false);
      },
    );
  }, [user]);

  // Listen to organizations where user is owner or listed as a member in real time
  useEffect(() => {
    if (!user || !db || !profile) return;

    const orgsQuery = query(
      collection(db, "organizations"),
      or(
        where("ownerUserId", "==", user.uid),
        where("memberUserIds", "array-contains", user.uid)
      )
    );

    return onSnapshot(orgsQuery, (snapshot) => {
      const orgIds = snapshot.docs.map((doc) => doc.id);
      
      // Update local context profile state
      setProfile((prev) => {
        if (!prev) return null;
        const newRole = prev.role === "admin" ? "admin" : (orgIds.length > 0 ? "partner" : prev.role);
        if (
          JSON.stringify(prev.organizationIds) === JSON.stringify(orgIds) &&
          prev.role === newRole
        ) {
          return prev;
        }
        return {
          ...prev,
          organizationIds: orgIds,
          role: newRole,
        };
      });

      // Synchronize changes to the user's document in Firestore database
      if (!db) return;
      const userDocOrgs = profile.organizationIds || [];
      const hasOrgsChanged =
        JSON.stringify([...userDocOrgs].sort()) !== JSON.stringify([...orgIds].sort());

      if (hasOrgsChanged) {
        updateDoc(doc(db, "users", user.uid), {
          organizationIds: orgIds,
        }).catch((err) => {
          console.error("Erro ao sincronizar organizationIds no documento do usuario:", err);
        });
      }
    });
  }, [user, profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      isProfileLoading,
      isConfigured: isFirebaseConfigured,
      signInWithGoogle: async () => {
        if (!auth) {
          throw new Error("Firebase Auth is not configured");
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
      },
      signOut: async () => {
        if (!auth) {
          return;
        }

        await firebaseSignOut(auth);
      },
    }),
    [isLoading, isProfileLoading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
