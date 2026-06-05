import { useState, useCallback } from "react";
import { Navbar } from "./navbar";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: React.ReactNode;
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
      setError("Incorrect code.");
      setPin("");
    }
  }

  return (
    <footer className="border-t border-border/40 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-serif font-semibold text-foreground/60">
            App<span className="text-primary/60">World</span>
          </span>
          <span>— Discover what the web can do.</span>
        </div>
        <button
          onClick={handleTonbiTap}
          className="text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors text-xs select-none"
          aria-label="Built by Tonbi360"
        >
          Built by Tonbi360
        </button>
      </div>

      {/* Secret admin gate */}
      {showAdminGate && !user?.role?.match(/admin/) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAdminGate(false)}>
          <div
            className="bg-[#141418] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-foreground mb-1">Access code</h2>
            <p className="text-xs text-muted-foreground mb-4">Enter the admin passphrase.</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(""); }}
                placeholder="Passphrase"
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminGate(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
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

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
