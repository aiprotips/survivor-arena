"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const navItems = ["Arene", "Classifiche", "Come Funziona", "Premi", "FAQ"];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="site-header">
      <div className="arena-shell">
        <div className="site-nav-panel">
          <a className="site-header-brand" href="#" onClick={closeMenu}>
            <BrandLogo />
          </a>

          <nav aria-label="Navigazione principale" className="site-nav-links">
            {navItems.map((item) => (
              <a className="site-nav-link" href="#" key={item}>
                {item}
              </a>
            ))}
          </nav>

          <div className="site-nav-actions">
            <ButtonLink className="site-nav-button" href="/login" variant="secondary">
              Accedi
            </ButtonLink>
            <Button className="site-nav-button">Registrati</Button>
          </div>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-hidden={isMenuOpen}
            aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
            className={cn("site-menu-button", isMenuOpen && "site-menu-button-open")}
            onClick={() => setIsMenuOpen((current) => !current)}
            tabIndex={isMenuOpen ? -1 : undefined}
            type="button"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {isMenuOpen ? (
          <div
            aria-label="Menu principale"
            aria-modal="true"
            className="site-mobile-overlay"
            id="mobile-navigation"
            role="dialog"
          >
            <div className="site-mobile-overlay-shell">
              <div className="site-mobile-overlay-top">
                <BrandLogo />
                <button
                  aria-label="Chiudi menu"
                  className="site-menu-button site-menu-button-open site-menu-close-button"
                  onClick={closeMenu}
                  type="button"
                >
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </button>
              </div>

              <div className="site-mobile-menu">
                <nav aria-label="Navigazione mobile" className="site-mobile-links">
                  {navItems.map((item) => (
                    <a className="site-mobile-link" href="#" key={item} onClick={closeMenu}>
                      {item}
                    </a>
                  ))}
                </nav>
                <div className="site-mobile-actions">
                  <ButtonLink
                    className="site-mobile-button"
                    href="/login"
                    onClick={closeMenu}
                    variant="secondary"
                  >
                    Accedi
                  </ButtonLink>
                  <Button className="site-mobile-button">Registrati</Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
