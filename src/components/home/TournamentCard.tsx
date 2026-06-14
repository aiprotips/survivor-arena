import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type TournamentCardProps = {
  title: string;
  prize: string;
  participants: string;
  status: string;
  image: string;
  buttonLabel: string;
};

export function TournamentCard({
  title,
  prize,
  participants,
  status,
  image,
  buttonLabel,
}: TournamentCardProps) {
  return (
    <Card className="overflow-hidden p-3">
      <div className="premium-image-frame relative aspect-[16/10]">
        <Image
          alt=""
          className="size-full object-cover opacity-80"
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-arena-card via-arena-card/20 to-transparent" />
        <Badge className="absolute left-4 top-4" tone="gold">
          {status}
        </Badge>
      </div>
      <div className="space-y-5 p-4">
        <div>
          <h3 className="text-xl font-black text-arena-white">{title}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-arena-muted-soft">
                Montepremi
              </p>
              <p className="mt-1 text-lg font-black text-arena-gold">{prize}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-arena-muted-soft">
                Partecipanti
              </p>
              <p className="mt-1 text-lg font-black text-arena-white">{participants}</p>
            </div>
          </div>
        </div>
        <Button className="w-full" variant="secondary">
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
}
