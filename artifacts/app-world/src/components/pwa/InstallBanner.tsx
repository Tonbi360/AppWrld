import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallBanner() {
  const { showBanner, isInstalling, promptInstall, dismiss } = usePWAInstall();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
        >
          <div
            style={{
              background: "hsl(258 90% 66% / 0.12)",
              border: "1px solid hsl(258 90% 66% / 0.3)",
              backdropFilter: "blur(16px)",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "hsl(258 90% 66%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v13M7 9l5 5 5-5"/>
                <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                Add AppWorld to home screen
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Browse and discover PWAs instantly
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                onClick={dismiss}
                aria-label="Dismiss install prompt"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "6px",
                  lineHeight: 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              <button
                onClick={promptInstall}
                disabled={isInstalling}
                style={{
                  background: "hsl(258 90% 66%)",
                  border: "none",
                  color: "white",
                  cursor: isInstalling ? "wait" : "pointer",
                  padding: "0.375rem 0.875rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  opacity: isInstalling ? 0.7 : 1,
                }}
              >
                {isInstalling ? "Installing..." : "Install"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
