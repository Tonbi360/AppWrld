import { useState, useCallback } from "react";
import { Navbar } from "./navbar";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: React.ReactNode;
  /** Extra bottom padding for mobile bottom nav */
  mobileNavPadding?: boolean;
}

function Footer() {
  const { user } = useAuth();
  const [tapCount, setTapCount] = useState(0);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleTonbiTap = useCallback(() => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminGate(true);
        return 0;
      }
      return next;
    });
  }, []);

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "360admin") {
      window.location.href = "/admin";
    } else {
      setError("Incorrect passphrase.");
      setPin("");
    }
  }

  return (
    <footer className="border-t border-border/30 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm font-semibold text-foreground/50">
            App<span className="text-primary/50">World</span>
          </span>
          <span className="text-xs text-muted-foreground/60">Discover what the web can do.</span>
        </div>
        <button
          onClick={handleTonbiTap}
          className="text-[11px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors select-none"
        >
          Built by Tonbi360
        </button>
      </div>

      {showAdminGate && user?.role !== "admin" && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowAdminGate(false)}
        >
          <div
            className="bg-card border border-border/60 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Access code required</h2>
            <p className="text-xs text-muted-foreground mb-4">Enter the admin passphrase to continue.</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(""); }}
                placeholder="Passphrase"
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminGate(false)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}

export function Layout({ children, mobileNavPadding = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className={mobileNavPadding ? "pb-20 md:pb-0" : ""}>{children}</main>
      <div className={mobileNavPadding ? "pb-20 md:pb-0" : ""}>
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
