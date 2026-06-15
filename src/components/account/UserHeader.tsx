"use client";

import Link from "next/link";
import { Menu, Trophy } from "lucide-react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { UserDropdown } from "@/components/account/UserDropdown";
import { UserNav } from "@/components/account/UserNav";
import { TelegramIcon } from "@/components/ui/TelegramIcon";
import type { AccountUser } from "@/components/account/types";

type UserHeaderProps = {
  balance: string;
  onLogout: () => Promise<void>;
  onMenuOpen: () => void;
  user: AccountUser;
};

export function UserHeader({ balance, onLogout, onMenuOpen, user }: UserHeaderProps) {
  return (
    <header className="user-header">
      <div className="user-header-shell">
        <Link aria-label="Vai alla dashboard" className="user-header-brand" href="/dashboard">
          <BrandLogo />
        </Link>

        <UserNav className="user-header-nav" />

        <div className="user-header-actions">
          <span className="user-balance-pill">
            <Trophy aria-hidden="true" className="user-balance-icon" />
            <span>{balance}</span>
          </span>

          <UserDropdown onLogout={onLogout} user={user} />

          <div className="user-mobile-summary" aria-label={`Utente ${user.username}`}>
            <strong>{user.username}</strong>
            <span>{balance}</span>
          </div>

          <a
            aria-label="Apri il bot Telegram Survivor Arena"
            className="user-telegram-link"
            href="tg://resolve?domain=SurvivorArena_bot"
          >
            <TelegramIcon className="user-telegram-icon" />
          </a>

          <button
            aria-label="Apri menu area utente"
            className="site-menu-button user-menu-button"
            onClick={onMenuOpen}
            type="button"
          >
            <Menu aria-hidden="true" className="user-menu-icon" />
          </button>
        </div>
      </div>
    </header>
  );
}
