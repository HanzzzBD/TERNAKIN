import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginTerdaftar = false;

function pastikanPluginGsap(): void {
  if (pluginTerdaftar) return;
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    pluginTerdaftar = true;
  }
}

function apakahKurangiGerakan(): boolean {
  if (typeof window === "undefined") return true;
  if (typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "off"
  );
}

/**
 * Animasi transisi masuk halaman dan kartu-kartu di dalamnya setiap kali rute berpindah.
 * Hanya menganimasikan transform (y, scale) dan membersihkan properti setelah selesai
 * agar kontras teks tetap 100% memenuhi WCAG AA di setiap waktu.
 */
export function usePageTransition(
  containerRef: RefObject<HTMLElement | null>,
  routeKey: string,
): void {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || apakahKurangiGerakan()) return;

    pastikanPluginGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 14 },
        {
          y: 0,
          duration: 0.36,
          snap: { y: 1 },
          ease: "power2.out",
          clearProps: "transform",
        },
      );

      const kartu = el.querySelectorAll<HTMLElement>(":scope > .tk-card, :scope > section");
      if (kartu.length > 0) {
        gsap.fromTo(
          kartu,
          { y: 18 },
          {
            y: 0,
            duration: 0.42,
            stagger: 0.05,
            snap: { y: 1 },
            ease: "power3.out",
            clearProps: "transform",
          },
        );
      }
    }, el);

    return () => {
      ctx.revert();
    };
  }, [containerRef, routeKey]);
}

/**
 * Animasi GSAP + ScrollTrigger untuk seluruh bagian pada Landing Page (/).
 */
export function useLandingGsap(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || apakahKurangiGerakan()) return;

    pastikanPluginGsap();

    const ctx = gsap.context(() => {
      // 1. Hero entrance
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(
          ".tk-hero__copy > *",
          { y: 22 },
          { y: 0, duration: 0.55, stagger: 0.08, clearProps: "transform" },
        )
        .fromTo(
          ".tk-hero__visual-col .tk-phone",
          { y: 28, scale: 0.96 },
          { y: 0, scale: 1, duration: 0.65, clearProps: "transform" },
          "-=0.4",
        )
        .fromTo(
          ".tk-hero__kokok-card",
          { y: 18, scale: 0.94 },
          { y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)", clearProps: "transform" },
          "-=0.35",
        );

      // 2. Judul tiap section saat digulir
      const judulSections = root.querySelectorAll<HTMLElement>(".tk-section .tk-landing-h2");
      judulSections.forEach((judul) => {
        gsap.fromTo(
          judul,
          { y: 24 },
          {
            y: 0,
            duration: 0.55,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: judul,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      // 3. Kartu statistik masalah
      const kartuMasalah = root.querySelectorAll<HTMLElement>(".tk-stat-grid > *");
      if (kartuMasalah.length > 0) {
        gsap.fromTo(
          kartuMasalah,
          { y: 30, scale: 0.97 },
          {
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".tk-stat-grid",
              start: "top 88%",
            },
          },
        );
      }

      // 4. Empat modul utama (bergantian kiri dan kanan)
      const barisModul = root.querySelectorAll<HTMLElement>(".tk-module-row");
      barisModul.forEach((baris, idx) => {
        const arah = idx % 2 === 0 ? -24 : 24;
        gsap.fromTo(
          baris,
          { x: arah, y: 20 },
          {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: baris,
              start: "top 88%",
            },
          },
        );
      });

      // 5. Tiga langkah cara mulai
      const kartuLangkah = root.querySelectorAll<HTMLElement>(".tk-steps-grid > *");
      if (kartuLangkah.length > 0) {
        gsap.fromTo(
          kartuLangkah,
          { y: 28, scale: 0.97 },
          {
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".tk-steps-grid",
              start: "top 88%",
            },
          },
        );
      }

      // 6. Poin kepercayaan & maskot Kokok
      const itemKepercayaan = root.querySelectorAll<HTMLElement>(
        ".tk-trust-item, .tk-trust-mascot-card",
      );
      if (itemKepercayaan.length > 0) {
        gsap.fromTo(
          itemKepercayaan,
          { y: 26 },
          {
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".tk-trust-layout",
              start: "top 88%",
            },
          },
        );
      }

      // 7. Grid 2 kolom Toko Pakan & Bukti Lapangan
      const kartuMitraPilot = root.querySelectorAll<HTMLElement>(".tk-partner-pilot-grid > *");
      if (kartuMitraPilot.length > 0) {
        gsap.fromTo(
          kartuMitraPilot,
          { y: 28, scale: 0.98 },
          {
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".tk-partner-pilot-grid",
              start: "top 88%",
            },
          },
        );
      }

      // 8. Akordeon FAQ
      const itemFaq = root.querySelectorAll<HTMLElement>("#faq .tk-accordion__item");
      if (itemFaq.length > 0) {
        gsap.fromTo(
          itemFaq,
          { y: 18 },
          {
            y: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: "power2.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: "#faq",
              start: "top 88%",
            },
          },
        );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [rootRef]);
}

/**
 * Animasi stagger kiri-ke-kanan saat floating pill navbar di landing page membuka.
 */
export function animateFloatingPillOpen(pillEl: HTMLElement | null): void {
  if (!pillEl || apakahKurangiGerakan()) return;
  const items = pillEl.querySelectorAll<HTMLElement>(".tk-floating-pill__item");
  if (items.length === 0) return;

  gsap.killTweensOf(items);
  gsap.fromTo(
    items,
    { x: -14 },
    {
      x: 0,
      duration: 0.32,
      stagger: 0.035,
      ease: "power2.out",
      clearProps: "transform",
    },
  );
}
