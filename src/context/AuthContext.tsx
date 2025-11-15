"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const firebaseErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "이미 사용 중인 이메일 주소입니다.";
      case "auth/invalid-email":
        return "이메일 형식이 올바르지 않습니다.";
      case "auth/user-disabled":
        return "비활성화된 계정입니다.";
      case "auth/user-not-found":
        return "등록되지 않은 계정입니다.";
      case "auth/wrong-password":
        return "비밀번호가 올바르지 않습니다.";
      case "auth/popup-closed-by-user":
        return "인증 팝업이 닫혔습니다. 다시 시도해 주세요.";
      default:
        return "인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth user changed", firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const runAuthAction = useCallback(async (callback: () => Promise<void>) => {
    setActionPending(true);
    setAuthError(null);
    try {
      await callback();
    } catch (error) {
      console.error(error);
      setAuthError(firebaseErrorMessage(error));
      throw error;
    } finally {
      setActionPending(false);
    }
  }, []);

  const signInHandler = useCallback(
    (email: string, password: string) =>
      runAuthAction(() => signInWithEmailAndPassword(auth, email, password)),
    [runAuthAction]
  );

  const signUpHandler = useCallback(
    (email: string, password: string) =>
      runAuthAction(() => createUserWithEmailAndPassword(auth, email, password)),
    [runAuthAction]
  );

  const signInWithGoogleHandler = useCallback(
    () =>
      runAuthAction(() =>
        signInWithPopup(auth, new GoogleAuthProvider())
      ),
    [runAuthAction]
  );

  const signOutHandler = useCallback(
    () => runAuthAction(() => signOut(auth)),
    [runAuthAction]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: loading || actionPending,
      authError,
      signIn: signInHandler,
      signUp: signUpHandler,
      signInWithGoogle: signInWithGoogleHandler,
      signOutUser: signOutHandler,
      clearError: () => setAuthError(null),
    }),
    [
      user,
      loading,
      actionPending,
      authError,
      signInHandler,
      signUpHandler,
      signInWithGoogleHandler,
      signOutHandler,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
