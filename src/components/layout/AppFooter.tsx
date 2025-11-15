const currentYear = new Date().getFullYear();

export default function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:text-left">
        <p>© {currentYear} Trip-Mate. 모든 여행이 더 쉬워지도록.</p>
        <p className="text-[11px] text-slate-400">
          Phase 1 Web MVP · Google Maps & Places 연동 예정
        </p>
      </div>
    </footer>
  );
}
