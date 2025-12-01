"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
  fallbackMessage?: string;
};

export default function RequireAuth({
  children,
  fallbackMessage = "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
}: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-600 shadow">
          로그인 상태 확인 중...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="space-y-3 rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-600 shadow">
          <p>{fallbackMessage}</p>
          <button
            type="button"
            className="text-sm font-semibold text-orange-600 underline"
            onClick={() => router.replace("/login")}
          >
            로그인 페이지로 이동
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
