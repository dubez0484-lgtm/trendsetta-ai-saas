import Link from "next/link";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between border-b border-white/10 bg-matte-950/80 px-4 backdrop-blur-lg">
      <h1 className="font-display text-base font-semibold text-white">{title}</h1>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/60 transition hover:text-white"
        >
          Sign out
        </button>
      </form>
      <Link href="/" className="sr-only">
        Home
      </Link>
    </header>
  );
}
