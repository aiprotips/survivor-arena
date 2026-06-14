import Image from "next/image";

export function BrandLogo() {
  return (
    <div className="brand-mark" aria-label="Survivor Arena">
      <span className="brand-emblem" aria-hidden="true">
        <Image
          alt=""
          className="brand-logo-image"
          height={826}
          priority
          src="/assets/survivor-arena-logo.png"
          width={733}
        />
      </span>
      <span className="brand-text">
        <span className="brand-title">Survivor</span>
        <span className="brand-subtitle">Arena</span>
      </span>
    </div>
  );
}
