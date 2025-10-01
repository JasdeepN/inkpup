"use client";
import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const createRainbowPalette = (lightness: number, saturation: number) =>
  Array.from({ length: 32 }, (_, index) => {
    const hue = Math.round((360 / 32) * index);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });

const RAINBOW_COLORS_DARK = createRainbowPalette(65, 92);
const RAINBOW_COLORS_LIGHT = createRainbowPalette(46, 88);

export default function ParticlesBackground() {
  const [disabled, setDisabled] = useState(true);
  const [engineReady, setEngineReady] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // runtime checks: reduced motion, save-data, slow-network, small viewport
    const mqReduce =
      typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : undefined;
    const checkConnection = () => {
      // @ts-ignore navigator.connection may be undefined
      const conn = (navigator as any).connection;
      if (conn) {
        if (conn.saveData) return { saveData: true, effectiveType: conn.effectiveType };
        return { saveData: false, effectiveType: conn.effectiveType };
      }
      return { saveData: false, effectiveType: undefined };
    };

    const evaluate = () => {
      if (typeof window === "undefined") return true;
      if (mqReduce?.matches) return true;
      const { saveData, effectiveType } = checkConnection();
      if (saveData) return true;
      if (effectiveType && /2g|slow-2g/.test(String(effectiveType))) return true;
      if (window.innerWidth < 640) return true; // mobile small screens: disable
      return false;
    };

    const onChange = () => setDisabled(evaluate());
    const navConnection = typeof navigator !== "undefined" ? (navigator as any).connection : undefined;

    onChange();

    mqReduce?.addEventListener?.("change", onChange);
    navConnection?.addEventListener?.("change", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      mqReduce?.removeEventListener?.("change", onChange);
      navConnection?.removeEventListener?.("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    })
      .then(() => {
        if (isMounted) setEngineReady(true);
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[ParticlesBackground] Failed to initialize tsParticles", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    let isMounted = true;
    const root = document.documentElement;
    const updateTheme = () => {
      if (!isMounted) return;
      setIsDark(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, []);

  const options = useMemo(
    () =>
      ({
        fullScreen: { enable: false },
        particles: {
          number: { value: 72, density: { enable: true, area: 800 } },
          color: { value: isDark ? RAINBOW_COLORS_DARK : RAINBOW_COLORS_LIGHT },
          shape: { type: "circle" },
          opacity: { value: isDark ? 0.9 : 0.95 },
          shadow: {
            enable: true,
            color: { value: isDark ? "#ffffff" : "rgba(30, 41, 59, 0.6)" },
            blur: isDark ? 5 : 8,
            offset: { x: 0, y: 0 },
          },
          size: { value: isDark ? { min: 0.6, max: 2.2 } : { min: 0.9, max: 2.8 } },
          move: { enable: true, speed: isDark ? 0.4 : 0.48, outModes: { default: "out" } },
          links: {
            enable: true,
            distance: 90,
            color: { value: isDark ? "#e2e8f0" : "#475569" },
            opacity: isDark ? 0.08 : 0.18,
            width: 1,
            shadow: {
              enable: true,
              blur: isDark ? 4 : 6,
              color: { value: isDark ? "rgba(148, 163, 184, 0.45)" : "rgba(71, 85, 105, 0.45)" },
            },
          },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: "repulse" }, resize: true },
          modes: { repulse: { distance: 120, speed: 0.7 } },
        },
        detectRetina: true,
        fpsLimit: 60,
      }) as any,
    [isDark],
  );

  const wrapperStyle = { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" } as const;
  const staticBackground = useMemo(
    () =>
      isDark
        ? "radial-gradient(circle at 10% 10%, rgba(99,102,241,0.025), transparent 15%), radial-gradient(circle at 90% 90%, rgba(236,72,153,0.018), transparent 18%)"
        : "radial-gradient(circle at 15% 12%, rgba(79,70,229,0.12), transparent 38%), radial-gradient(circle at 82% 88%, rgba(14,165,233,0.12), transparent 35%), radial-gradient(circle at 45% 55%, rgba(236,72,153,0.08), transparent 62%)",
    [isDark],
  );

  if (!engineReady || disabled) {
    return (
      <div
        className="particles-wrapper particles-wrapper--static"
        style={{ ...wrapperStyle, background: staticBackground }}
        data-testid="particles-fallback"
        aria-hidden
      />
    );
  }

  return (
    <div className="particles-wrapper" style={wrapperStyle} aria-hidden>
      <Particles id="background-particles" className="particles-wrapper__canvas" options={options} />
    </div>
  );
}
