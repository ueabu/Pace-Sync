import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppShell({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground hover:text-accent"
          >
            Pacelist
          </Link>
          {isAuthed ? (
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="sm" className="shrink-0">
                Log out
              </Button>
            </form>
          ) : null}
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6")}>
        {children}
      </main>
    </div>
  );
}
