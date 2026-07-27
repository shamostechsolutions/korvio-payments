"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function LandingStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("landing-hero");
    const footerCta = document.getElementById("landing-final-cta");
    if (!hero || !footerCta) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setVisible(true);
        else setVisible(false);
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" },
    );

    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(false);
      },
      { threshold: 0.2 },
    );

    heroObserver.observe(hero);
    footerObserver.observe(footerCta);

    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`landing-sticky-cta md:hidden ${visible ? "landing-sticky-cta-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="landing-sticky-cta-inner">
        <p className="landing-sticky-cta-label">Group collections</p>
        <Link href="/register" className="flex-1">
          <Button className="w-full" size="sm">
            Start a campaign
          </Button>
        </Link>
      </div>
    </div>
  );
}
