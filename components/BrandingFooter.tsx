"use client";

import { useEffect, useRef, useState } from "react";

export function BrandingFooter() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 2500);
    };

    // Initial trigger when user opens/scrolls
    handleActivity();

    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  return (
    <footer className={`branding-footer ${visible ? "visible" : ""}`} aria-hidden={!visible}>
      <div className="branding-pill">
        <span className="branding-logo"><span style={{ color: "var(--lime)", marginRight: "0.25rem" }}>◆</span>DarkDesk</span>
        <span className="branding-dot">•</span>
        <span className="branding-text">by <strong style={{ color: "var(--text)", fontWeight: 700 }}>Akshay Bhagat</strong></span>
        <span className="branding-dot">•</span>
        <a href="mailto:ab6790332@gmail.com" className="branding-email">ab6790332@gmail.com</a>
        <span className="branding-dot">•</span>
        <span className="branding-text">Next.js & Supabase</span>
        <span className="branding-dot">•</span>
        <span className="branding-tag">v1.0</span>
      </div>
    </footer>
  );
}
