"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [manualError, setManualError] = useState("");
  const { signIn, signUp, signInWithGoogle, authError, clearError, loading, user } =
    useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const errorMessage = manualError || authError || "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setManualError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setManualError("");
    if (mode === "login") {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  const handleGoogle = async () => {
    setManualError("");
    await signInWithGoogle();
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setManualError("");
    clearError();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-600 shadow">
          로그인 상태 확인 중...
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-600 shadow">
          이미 로그인되어 대시보드로 이동 중입니다...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            로그인 / 회원가입
          </h1>
          <p className="text-sm text-gray-500">
            {user
              ? `${user.email} 계정으로 로그인 되어 있습니다.`
              : "Google · 이메일 인증을 통해 Trip-Mate에 참여하세요."}
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {errorMessage}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {mode === "login" ? "이메일로 로그인" : "이메일로 가입"}
          </Button>
        </form>
        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleGoogle}
            disabled={loading}
          >
            Google 계정으로 계속하기
          </Button>
          <Button type="button" variant="ghost" fullWidth disabled>
            Kakao 로그인 (준비 중)
          </Button>
        </div>
        <p className="text-center text-sm text-gray-500">
          {mode === "login" ? "아직 계정이 없나요?" : "이미 계정이 있나요?"}{" "}
          <button
            type="button"
            className="font-semibold text-orange-500 underline underline-offset-4"
            onClick={toggleMode}
          >
            {mode === "login" ? "회원가입으로 전환" : "로그인으로 전환"}
          </button>
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-orange-500 hover:underline"
        >
          ← 메인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
