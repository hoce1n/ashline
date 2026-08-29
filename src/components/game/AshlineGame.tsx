"use client";

import { ArrowDown, ArrowUp, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Engine, type HudSnapshot } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

const idleHud: HudSnapshot = {
  state: "title",
  score: 0,
  combo: 0,
  comboFlash: 0,
  highScore: 0,
  distance: 0,
  speed: 0,
  newBest: false,
  bestCombo: 0,
  muted: false,
  peakCombo: 0,
};

export function AshlineGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(idleHud);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const engine = new Engine(canvas, (snap) => {
      if (!cancelled) setHud(snap);
    });
    engineRef.current = engine;
    engine
      .init()
      .then(() => {
        if (cancelled) {
          engine.destroy();
          return;
        }
        setReady(true);
        engine.start();
      })
      .catch((err: unknown) => {
        if (!cancelled) setFailed(err instanceof Error ? err.message : "Could not start");
      });
    return () => {
      cancelled = true;
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const onMute = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setMuted(!hud.muted);
  }, [hud.muted]);

  const meters = Math.floor(hud.distance / 24);
  const playing = hud.state === "playing" || hud.state === "dying";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="ASHLINE playfield"
      />

      {!ready && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg">
          <p className="font-display text-sm tracking-[0.2em] text-muted uppercase">Loading the ridge</p>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg px-6">
          <p className="max-w-sm text-center text-sm text-muted">{failed}</p>
        </div>
      )}

      {ready && hud.state === "title" && <TitleOverlay highScore={hud.highScore} />}

      {ready && playing && (
        <HudOverlay
          score={hud.score}
          combo={hud.combo}
          comboFlash={hud.comboFlash}
          highScore={hud.highScore}
          meters={meters}
        />
      )}

      {ready && hud.state === "over" && (
        <OverOverlay
          score={hud.score}
          highScore={hud.highScore}
          newBest={hud.newBest}
          meters={meters}
          peakCombo={hud.peakCombo}
        />
      )}

      {ready && (
        <div className="pointer-events-none absolute top-0 right-0 z-20 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto bg-surface/70 text-muted hover:text-fg"
            aria-label={hud.muted ? "Unmute" : "Mute"}
            onClick={onMute}
          >
            <span className="relative block size-4">
              <Volume2
                className={cn(
                  "absolute inset-0 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                  hud.muted ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
                )}
              />
              <VolumeX
                className={cn(
                  "absolute inset-0 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                  hud.muted ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
                )}
              />
            </span>
          </Button>
        </div>
      )}

      {ready && playing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto h-14 flex-1 rounded-[28px] border-border bg-surface/80 text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              engineRef.current?.tapJump();
            }}
          >
            <ArrowUp className="size-4" />
            Jump
          </Button>
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto h-14 flex-1 rounded-[28px] border-border bg-surface/80 text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              engineRef.current?.tapSlide();
            }}
          >
            <ArrowDown className="size-4" />
            Slide
          </Button>
        </div>
      )}
    </main>
  );
}

function TitleOverlay({ highScore }: { highScore: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="ash-enter font-display text-xs tracking-[0.32em] text-muted uppercase">Dusk ridge courier</p>
        <h1 className="ash-enter-2 mt-3 font-display text-6xl font-bold tracking-[-0.04em] text-fg sm:text-7xl">
          ASHLINE
        </h1>
        <p className="ash-enter-3 mt-4 text-base leading-relaxed text-muted">
          The highway is coming apart. Jump the wrecks, slide the beams, keep the line.
        </p>
        <p className="ash-enter-4 mt-8 font-display text-sm tracking-[0.18em] text-fg uppercase">
          Tap or press space
        </p>
        {highScore > 0 && (
          <p className="ash-enter-4 mt-3 text-sm text-muted tabular-nums">Best {highScore.toLocaleString()}</p>
        )}
      </div>
      <dl className="ash-enter-4 pointer-events-none mt-16 hidden gap-8 text-xs tracking-wide text-subtle uppercase sm:flex">
        <div className="flex items-center gap-2">
          <ArrowUp className="size-3.5" />
          <span>Space · tap</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDown className="size-3.5" />
          <span>Down · swipe</span>
        </div>
      </dl>
    </div>
  );
}

function HudOverlay({
  score,
  combo,
  comboFlash,
  highScore,
  meters,
}: {
  score: number;
  combo: number;
  comboFlash: number;
  highScore: number;
  meters: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div>
        <p className="font-display text-3xl font-semibold tracking-tight text-fg tabular-nums">{score.toLocaleString()}</p>
        <p className="mt-1 text-xs tracking-wide text-muted uppercase tabular-nums">{meters} m</p>
      </div>
      <div className="absolute top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 text-center">
        {combo > 1 && (
          <p
            key={combo}
            className="ash-pop font-display text-2xl font-semibold text-fg tabular-nums"
            style={{ opacity: comboFlash > 0 ? 1 : 0.85 }}
          >
            x{combo}
          </p>
        )}
      </div>
      <p className="pr-14 text-right text-xs tracking-wide text-muted uppercase tabular-nums">
        Best {highScore.toLocaleString()}
      </p>
    </div>
  );
}

function OverOverlay({
  score,
  highScore,
  newBest,
  meters,
  peakCombo,
}: {
  score: number;
  highScore: number;
  newBest: boolean;
  meters: number;
  peakCombo: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/55 px-6">
      <div className="w-full max-w-sm rounded-[32px] border border-border bg-surface p-6 pt-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="ash-enter text-xs tracking-[0.28em] text-muted uppercase">Line broken</p>
        <p className="ash-enter-2 mt-3 font-display text-5xl font-semibold tracking-tight text-fg tabular-nums">
          {score.toLocaleString()}
        </p>
        {newBest ? (
          <p className="ash-enter-3 mt-2 text-sm text-ok">New best</p>
        ) : (
          <p className="ash-enter-3 mt-2 text-sm text-muted tabular-nums">Best {highScore.toLocaleString()}</p>
        )}
        <div className="ash-enter-3 mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-surface-2 px-4 py-3">
            <p className="text-xs tracking-wide text-subtle uppercase">Distance</p>
            <p className="mt-1 font-display text-lg text-fg tabular-nums">{meters} m</p>
          </div>
          <div className="rounded-[20px] bg-surface-2 px-4 py-3">
            <p className="text-xs tracking-wide text-subtle uppercase">Peak combo</p>
            <p className="mt-1 font-display text-lg text-fg tabular-nums">x{Math.max(1, peakCombo)}</p>
          </div>
        </div>
        <p className="ash-enter-4 mt-8 text-center text-sm text-muted">Tap or press space to run again</p>
      </div>
    </div>
  );
}
