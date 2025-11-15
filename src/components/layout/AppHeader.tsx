"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "홈" },
  { href: "/dashboard", label: "대시보드" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const baseClasses =
    "rounded-full px-3 py-1 text-sm font-medium transition-colors";
  const activeClasses = "bg-orange-500 text-white";
  const inactiveClasses = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  const className = useMemo(
    () => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`,
    [isActive]
  );

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOutUser, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setMenuOpen(false);
    } catch (error) {
      console.error("로그아웃 실패", error);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Trip-Mate
        </Link>
        <nav className="hidden items-center gap-3 md:flex">
          {navLinks.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          {user ? (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="max-w-[160px] truncate font-medium text-slate-700">
                {user.email ?? "로그인한 계정"}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSignOut}
                disabled={loading}
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">로그인</Button>
            </Link>
          )}
        </nav>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="모바일 메뉴 열기"
        >
          메뉴
          <span className="text-xs text-slate-500">{menuOpen ? "닫기" : "열기"}</span>
        </button>
      </div>
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {user ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 text-sm">
                <p className="text-slate-700">{user.email ?? "로그인한 계정"}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSignOut}
                  disabled={loading}
                  fullWidth
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button fullWidth size="sm">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
