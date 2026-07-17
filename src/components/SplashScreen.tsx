import { useEffect, useState } from "react";

const SPLASH_MS = 1200; // ponytail: flash de marca; el app ya montó debajo y arranca auth en paralelo

/** Logo splash overlay shown on app open, then fades out. Children mount underneath immediately. */
export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduceTransparency = matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const t = setTimeout(() => setFading(true), reduceTransparency ? 250 : SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {children}
      {!gone && (
        <div
          role="img"
          aria-label="Xignis"
          onTransitionEnd={() => setGone(true)}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-primary)",
            zIndex: 9999,
            opacity: fading ? 0 : 1,
            transition: "opacity 300ms ease",
            pointerEvents: fading ? "none" : "auto",
          }}
        >
          <img
            src="/logo-dos.png"
            alt="Xignis"
            style={{ width: "min(80vw, 420px)", height: "auto" }}
          />
        </div>
      )}
    </>
  );
}
