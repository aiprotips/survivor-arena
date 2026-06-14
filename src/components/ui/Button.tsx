import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "gold";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  gold: "ui-button-gold",
};

function getButtonClassName(variant: ButtonVariant, className?: string) {
  return cn("ui-button w-full sm:w-auto", buttonVariants[variant], className);
}

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName(variant, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={getButtonClassName(variant, className)} {...props}>
      {children}
    </Link>
  );
}
