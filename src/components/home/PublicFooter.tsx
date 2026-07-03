import { Camera, Mail, Send } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/home/BrandLogo";

const footerLinks = [
  ["Termini e condizioni", "/termini"],
  ["Privacy policy", "/privacy"],
  ["Contatti", "mailto:assistenza.arenasurvivor@gmail.com"],
] as const;

export function PublicFooter() {
  return (
    <footer className="public-home-footer">
      <div className="public-home-footer-inner">
        <Link className="public-home-footer-brand" href="/" aria-label="Survivor Arena Home">
          <BrandLogo />
        </Link>
        <nav aria-label="Link footer" className="public-home-footer-links">
          {footerLinks.map(([label, href]) => (
            <a href={href} key={label}>
              {label}
            </a>
          ))}
        </nav>
        <div className="public-home-socials" aria-label="Social">
          <a aria-label="Instagram" href="#" rel="noreferrer">
            <Camera />
          </a>
          <a aria-label="Telegram" href="https://t.me/SurvivorArena_bot" rel="noreferrer">
            <Send />
          </a>
          <a aria-label="Email" href="mailto:assistenza.arenasurvivor@gmail.com">
            <Mail />
          </a>
        </div>
      </div>
    </footer>
  );
}
