import Image from "next/image";
import { cn } from "@/lib/cn";

type TournamentCardProps = {
  title: string;
  cups: string;
  status: string;
  image: string;
};

export function TournamentCard({
  title,
  cups,
  status,
  image,
}: TournamentCardProps) {
  const isLive = status.toLowerCase() === "in corso";

  return (
    <article className="tournament-card">
      <div className="tournament-media">
        <Image
          alt=""
          className="tournament-image"
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 25vw, 72vw"
          src={image}
        />
      </div>
      <div className="tournament-overlay" />
      <span className={cn("tournament-status", isLive && "tournament-status-live")}>
        {status}
      </span>
      <div className="tournament-copy">
        <h3 className="tournament-card-title">{title}</h3>
        <p className="tournament-card-label">Montepremi</p>
        <p className="tournament-card-value">{cups}</p>
      </div>
    </article>
  );
}
