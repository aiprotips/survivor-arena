import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "gold";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  gold: "ui-button-gold",
};

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn("ui-button w-full sm:w-auto", buttonVariants[variant], className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
