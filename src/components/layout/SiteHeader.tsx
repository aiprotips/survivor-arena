"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const navItems = ["Arene", "Classifiche", "Come Funziona", "Premi", "FAQ"];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

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
            <Button className="site-nav-button" variant="secondary">
              Accedi
            </Button>
            <Button className="site-nav-button">Registrati</Button>
          </div>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
            className={cn("site-menu-button", isMenuOpen && "site-menu-button-open")}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {isMenuOpen ? (
          <div className="site-mobile-menu site-mobile-menu-open" id="mobile-navigation">
            <nav aria-label="Navigazione mobile" className="site-mobile-links">
              {navItems.map((item) => (
                <a className="site-mobile-link" href="#" key={item} onClick={closeMenu}>
                  {item}
                </a>
              ))}
            </nav>
            <div className="site-mobile-actions">
              <Button className="site-mobile-button" variant="secondary">
                Accedi
              </Button>
              <Button className="site-mobile-button">Registrati</Button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
