import { Link } from "wouter";
import { ReactNode } from "react";
import { Gamepad2, Settings, MessageSquare, Plus } from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Gamepad2 className="w-6 h-6" /> AppWorld
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
            <Link href="/submit" className="hover:text-primary transition-colors flex items-center gap-1"><Plus className="w-4 h-4"/> Submit</Link>
            <Link href="/feedback" className="hover:text-primary transition-colors flex items-center gap-1"><MessageSquare className="w-4 h-4"/> Feedback</Link>
            <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1"><Settings className="w-4 h-4"/> Admin</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
