type TelegramIconProps = {
  className?: string;
};

export function TelegramIcon({ className }: TelegramIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.6 4.2 18.4 19c-.2 1-.8 1.2-1.6.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.1 12.7 1.3 11.2c-1-.3-1-1 .2-1.5L20.3 2.5c.9-.3 1.7.2 1.3 1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
