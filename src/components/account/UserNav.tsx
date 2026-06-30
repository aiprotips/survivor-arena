"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gem, LayoutDashboard, Trophy, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export const mainUserNavItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
}> = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/arene",
    icon: Trophy,
    label: "Arene",
  },
  {
    href: "/classifiche",
    icon: BarChart3,
    label: "Classifiche",
  },
  {
    href: "/premi-utente",
    icon: Gem,
    label: "Premi",
  },
];

export const friendsUserNavItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
}> = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/tornei",
    icon: UsersRound,
    label: "Tornei",
  },
];

type UserNavProps = {
  className?: string;
  mode?: "COPPE" | "FRIENDS";
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function UserNav({ className, mode = "COPPE", onNavigate, variant = "desktop" }: UserNavProps) {
  const pathname = usePathname();
  const items = mode === "FRIENDS" ? friendsUserNavItems : mainUserNavItems;

  return (
    <nav
      aria-label="Navigazione area utente"
      className={cn(
        variant === "desktop" ? "user-nav" : "user-mobile-nav",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              variant === "desktop" ? "user-nav-link" : "user-mobile-nav-link",
              isActive && "user-nav-link-active",
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" className="user-nav-icon" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
