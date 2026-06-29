"use client";

import Link from "next/link";
import { Mail, Menu, Trophy } from "lucide-react";
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

        <UserNav className="user-header-nav" mode={user.platform_mode} />

        <div className="user-header-actions">
          {user.platform_mode === "FRIENDS" ? (
            <span className="user-balance-pill">
              <Trophy aria-hidden="true" className="user-balance-icon" />
              <span>Friends</span>
            </span>
          ) : (
            <span className="user-balance-pill">
              <Trophy aria-hidden="true" className="user-balance-icon" />
              <span>{balance}</span>
            </span>
          )}

          <UserDropdown onLogout={onLogout} user={user} />

          <div className="user-mobile-summary" aria-label={`Utente ${user.username}`}>
            <strong>{user.username}</strong>
            <span>{user.platform_mode === "FRIENDS" ? "Friends" : balance}</span>
          </div>

          <Link
            aria-label={
              user.unread_message_count
                ? `Apri posta, ${user.unread_message_count} messaggi non letti`
                : "Apri posta"
            }
            className="user-mail-link"
            href="/posta"
          >
            <Mail aria-hidden="true" className="user-mail-icon" />
            {user.unread_message_count ? <span className="user-unread-dot" /> : null}
          </Link>

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
