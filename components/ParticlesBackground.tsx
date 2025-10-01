"use client";
import React, { useEffect, useState } from "react";
import { Particles } from "@tsparticles/react";
import { loadFull } from "tsparticles";

export default function ParticlesBackground() {
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    // runtime checks: reduced motion, save-data, slow-network, small viewport
    const mqReduce = typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)');
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
      if (mqReduce && mqReduce.matches) return true;
      const { saveData, effectiveType } = checkConnection();
      if (saveData) return true;
      if (effectiveType && /2g|slow-2g/.test(String(effectiveType))) return true;
      if (window.innerWidth < 640) return true; // mobile small screens: disable
      return false;
    };

    const onChange = () => setDisabled(evaluate());

    onChange();

    mqReduce && mqReduce.addEventListener && mqReduce.addEventListener("change", onChange);
    // @ts-ignore
    (navigator as any).connection && (navigator as any).connection.addEventListener && (navigator as any).connection.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      mqReduce && mqReduce.removeEventListener && mqReduce.removeEventListener("change", onChange);
      // @ts-ignore
      (navigator as any).connection && (navigator as any).connection.removeEventListener && (navigator as any).connection.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  const init = async (engine: any) => {
    await loadFull(engine);
  };

  const options = {
    fullScreen: { enable: false },
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      color: { value: "#6366f1" },
      shape: { type: "circle" },
      opacity: { value: 0.9 },
      size: { value: { min: 0.6, max: 2.2 } },
      move: { enable: true, speed: 0.4, outModes: { default: "out" } },
      links: { enable: true, distance: 90, color: "#6366f1", opacity: 0.06, width: 1 },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "repulse" }, resize: true },
      modes: { repulse: { distance: 120, speed: 0.7 } },
    },
    detectRetina: true,
    fpsLimit: 60,
  } as any;

  if (disabled) {
    // render nothing or a subtle static backdrop when disabled to keep visuals consistent
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(circle at 10% 10%, rgba(99,102,241,0.02), transparent 12%), radial-gradient(circle at 90% 90%, rgba(236,72,153,0.01), transparent 12%)" }} aria-hidden />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Particles init={init} options={options} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
