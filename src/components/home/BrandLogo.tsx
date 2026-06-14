export function BrandLogo() {
  return (
    <div className="brand-mark" aria-label="Survivor Arena">
      <span className="brand-emblem" aria-hidden="true">
        <svg className="brand-emblem-icon" viewBox="0 0 48 48">
          <path d="M14 11 24 6l10 5 4 12c-2 9-7 15-14 19-7-4-12-10-14-19l4-12Z" />
          <path d="m17 13 3 4 4-6 4 6 3-4v9H17v-9Z" />
          <path d="M18 24h12v4c0 3.4-2.6 6-6 6s-6-2.6-6-6v-4Z" />
          <path d="M18 26h-3c0 3 1.8 5 4.4 5" />
          <path d="M30 26h3c0 3-1.8 5-4.4 5" />
          <path d="M21 38h6" />
        </svg>
      </span>
      <span className="brand-text">
        <span className="brand-title">Survivor</span>
        <span className="brand-subtitle">Arena</span>
      </span>
    </div>
  );
}
