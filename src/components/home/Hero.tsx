import Image from "next/image";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="arena-shell pt-4 sm:pt-6">
      <div className="hero-panel">
        <Image
          alt=""
          className="hero-image"
          fetchPriority="high"
          fill
          priority
          sizes="100vw"
          src="/assets/arena-stadium.jpg"
        />
        <div className="relative z-10 flex min-h-[inherit] flex-col">
          <header className="flex items-center justify-between gap-4 p-5 sm:p-7">
            <BrandLogo />
            <Badge tone="gold">Stagione demo</Badge>
          </header>

          <div className="grid flex-1 place-items-center px-5 pb-24 pt-10 text-center sm:px-8">
            <div className="max-w-4xl">
              <Badge className="mx-auto" tone="gold">
                Competizione premium
              </Badge>
              <h1 className="mt-7 text-6xl font-black leading-[0.88] tracking-normal text-arena-white sm:text-7xl md:text-8xl lg:text-9xl">
                SURVIVOR
                <span className="block text-arena-blue-soft">ARENA</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl font-bold leading-8 text-arena-gold sm:text-2xl">
                Una sola scelta.
                <span className="block">Un solo vincitore.</span>
              </p>
              <div className="mx-auto mt-9 grid max-w-xl gap-3 sm:flex sm:justify-center">
                <Button>ENTRA NELL&apos;ARENA</Button>
                <Button variant="secondary">SCOPRI COME FUNZIONA</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
