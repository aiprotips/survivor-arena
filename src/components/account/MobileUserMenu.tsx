"use client";

import Link from "next/link";
import { LogOut, ReceiptText, Settings, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { UserNav } from "@/components/account/UserNav";
import type { AccountUser } from "@/components/account/types";

type MobileUserMenuProps = {
  balance: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  user: AccountUser;
};

const accountItems = [
  {
    href: "/profilo",
    icon: UserRound,
    label: "Profilo",
  },
  {
    href: "/movimenti",
    icon: ReceiptText,
    label: "Lista Movimenti",
  },
  {
    href: "/impostazioni",
    icon: Settings,
    label: "Impostazioni",
  },
];

export function MobileUserMenu({
  balance,
  isOpen,
  onClose,
  onLogout,
  user,
}: MobileUserMenuProps) {
  if (!isOpen) {
    return null;
  }

  const initial = user.username.slice(0, 1).toUpperCase();

  return (
    <div
      aria-label="Menu area utente"
      aria-modal="true"
      className="user-mobile-overlay"
      role="dialog"
    >
      <div className="user-mobile-shell">
        <div className="user-mobile-top">
          <BrandLogo />
          <button
            aria-label="Chiudi menu"
            className="site-menu-button site-menu-button-open user-mobile-close"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="user-mobile-profile">
          <span className="user-avatar" aria-hidden="true">
            {initial}
          </span>
          <div>
            <strong>{user.username}</strong>
            <span>{balance}</span>
          </div>
        </div>

        <UserNav onNavigate={onClose} variant="mobile" />

        <PremiumDivider className="user-mobile-divider" />

        <nav aria-label="Menu account" className="user-mobile-account">
          {accountItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="user-mobile-account-link"
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <Icon aria-hidden="true" className="user-nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button className="user-mobile-account-link" onClick={onLogout} type="button">
            <LogOut aria-hidden="true" className="user-nav-icon" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
