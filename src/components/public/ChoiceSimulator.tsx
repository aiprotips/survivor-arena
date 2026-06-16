"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Crown, Heart, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

type TeamChoice = "inter" | "juve";

const teams: Record<
  TeamChoice,
  {
    accent: string;
    label: string;
    message: string;
    short: string;
  }
> = {
  inter: {
    accent: "Nerazzurro",
    label: "Inter",
    message: "Scelta bloccata: ora l'Arena aspetta solo il risultato.",
    short: "INT",
  },
  juve: {
    accent: "Bianconero",
    label: "Juve",
    message: "Scelta registrata: la tua vita entra nel round.",
    short: "JUV",
  },
};

const particles = [
  [-4.8, -3.4],
  [-3.7, -5.2],
  [-2.4, -2.8],
  [-1.4, -6],
  [0.3, -3.8],
  [1.5, -5.7],
  [2.8, -3.1],
  [4.1, -5],
  [5.1, -2.8],
  [-5.2, 0.3],
  [-3.6, 1.8],
  [-1.7, 1],
  [0.4, 2.2],
  [2.3, 0.8],
  [3.8, 1.9],
  [5.3, 0.1],
] as const;

export function ChoiceSimulator() {
  const [selectedTeam, setSelectedTeam] = useState<TeamChoice | null>(null);

  const currentTeam = selectedTeam ? teams[selectedTeam] : null;

  return (
    <section
      aria-labelledby="choice-simulator-title"
      className={cn(
        "choice-simulator",
        selectedTeam === "juve" && "choice-simulator-juve",
        selectedTeam === "inter" && "choice-simulator-inter",
      )}
    >
      <div className="choice-stadium" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="choice-simulator-top">
        <div>
          <p className="user-page-kicker">Prova il Round 1</p>
          <h2 id="choice-simulator-title">Juve o Inter?</h2>
        </div>
        <span className="choice-deadline">
          <span>Deadline</span>
          02:14:32
        </span>
      </div>

      <div className="choice-life-card">
        <span className="choice-life-icon">
          <Heart aria-hidden="true" />
        </span>
        <div>
          <span>Vita selezionata</span>
          <strong>{currentTeam ? currentTeam.label : "In attesa della tua scelta"}</strong>
        </div>
      </div>

      <div className="choice-match" aria-label="Scegli una squadra demo">
        <ChoiceButton
          isSelected={selectedTeam === "juve"}
          onClick={() => setSelectedTeam("juve")}
          team="juve"
        />
        <span className="choice-versus">VS</span>
        <ChoiceButton
          isSelected={selectedTeam === "inter"}
          onClick={() => setSelectedTeam("inter")}
          team="inter"
        />
      </div>

      <div className="choice-result-panel" aria-live="polite">
        {currentTeam ? (
          <>
            <Celebration team={selectedTeam} />
            <span className="choice-result-badge">
              <ShieldCheck aria-hidden="true" />
              {currentTeam.accent}
            </span>
            <strong>{currentTeam.message}</strong>
            <p>La scelta resta modificabile fino alla deadline. Poi si entra nel silenzio dell&apos;Arena.</p>
          </>
        ) : (
          <>
            <span className="choice-result-badge choice-result-badge-idle">
              <Sparkles aria-hidden="true" />
              Tocca una squadra
            </span>
            <strong>La scelta è il cuore del gioco.</strong>
            <p>Prova la simulazione: seleziona una squadra e guarda come cambia la tua vita.</p>
          </>
        )}
      </div>

      <div className="choice-trophy-mark" aria-hidden="true">
        <Crown />
        <Trophy />
      </div>
    </section>
  );
}

function ChoiceButton({
  isSelected,
  onClick,
  team,
}: {
  isSelected: boolean;
  onClick: () => void;
  team: TeamChoice;
}) {
  const teamData = teams[team];

  return (
    <button
      aria-pressed={isSelected}
      className={cn("choice-team-button", `choice-team-${team}`, isSelected && "is-selected")}
      onClick={onClick}
      type="button"
    >
      <span className="choice-team-crest">{teamData.short}</span>
      <strong>{teamData.label}</strong>
      <em>{isSelected ? "Scelta" : "Scegli"}</em>
    </button>
  );
}

function Celebration({ team }: { team: TeamChoice | null }) {
  if (!team) {
    return null;
  }

  return (
    <div className={cn("choice-celebration", `choice-celebration-${team}`)} aria-hidden="true">
      {particles.map(([x, y], index) => (
        <span
          key={`${team}-${index}`}
          style={
            {
              "--particle-delay": `${(index % 5) * 32}ms`,
              "--particle-x": `${x}rem`,
              "--particle-y": `${y}rem`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
