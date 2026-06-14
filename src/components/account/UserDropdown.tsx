"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, ReceiptText, Settings, UserRound } from "lucide-react";
import type { AccountUser } from "@/components/account/types";
import { cn } from "@/lib/cn";

type UserDropdownProps = {
  onLogout: () => Promise<void>;
  user: AccountUser;
};

const accountLinks = [
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

export function UserDropdown({ onLogout, user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initial = user.username.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn("user-avatar-button", isOpen && "user-avatar-button-active")}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="user-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="user-avatar-name">{user.username}</span>
      </button>

      {isOpen ? (
        <div className="user-dropdown-menu" role="menu">
          {accountLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="user-dropdown-item"
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <Icon aria-hidden="true" className="user-dropdown-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            className="user-dropdown-item user-dropdown-logout"
            onClick={onLogout}
            role="menuitem"
            type="button"
          >
            <LogOut aria-hidden="true" className="user-dropdown-icon" />
            <span>Logout</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
