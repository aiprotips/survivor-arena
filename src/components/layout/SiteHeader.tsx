"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CircleHelp,
  Home,
  MessageCircle,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { cn } from "@/lib/cn";

const navItems = ["Arene", "Classifiche", "Come Funziona", "Premi", "FAQ"];

const mobileNavItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
}> = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "#",
    icon: Trophy,
    label: "Arene",
  },
  {
    href: "#",
    icon: BarChart3,
    label: "Classifiche",
  },
  {
    href: "#",
    icon: CircleHelp,
    label: "Come Funziona",
  },
];

const secondaryNavItems = ["FAQ", "Privacy", "Cookie"];

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
            <ButtonLink className="site-nav-button" href="/register">
              Registrati
            </ButtonLink>
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
                <div className="site-mobile-auth-actions">
                  <ButtonLink
                    className="site-mobile-auth-button"
                    href="/login"
                    onClick={closeMenu}
                    variant="secondary"
                  >
                    Accedi
                  </ButtonLink>
                  <ButtonLink
                    className="site-mobile-auth-button"
                    href="/register"
                    onClick={closeMenu}
                  >
                    Registrati
                  </ButtonLink>
                </div>

                <nav aria-label="Navigazione mobile" className="site-mobile-links">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <a
                        className="site-mobile-link"
                        href={item.href}
                        key={item.label}
                        onClick={closeMenu}
                      >
                        <Icon aria-hidden="true" className="site-mobile-link-icon" />
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </nav>

                <PremiumDivider className="site-mobile-divider" />

                <nav aria-label="Menu secondario" className="site-mobile-secondary-links">
                  {secondaryNavItems.map((item) => (
                    <a
                      className="site-mobile-secondary-link"
                      href="#"
                      key={item}
                      onClick={closeMenu}
                    >
                      {item}
                    </a>
                  ))}
                </nav>

                <section aria-label="Contattaci" className="site-mobile-contact">
                  <Button className="site-mobile-contact-button" type="button" variant="secondary">
                    <MessageCircle aria-hidden="true" className="site-mobile-contact-icon" />
                    Contattaci
                  </Button>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
