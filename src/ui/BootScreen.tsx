import { useEffect, useRef, useState } from "react";
import { CLASSES } from "../game/classes";

const BASE_LINES = [
  "ElecOS(R) Kernel 4.2.7 — sequencia de partida",
  "Verificando memoria ................. 16384 MB OK",
  "Processador neural .................. 8 nucleos OK",
  "Nucleo grafico VULKAN-9 ............. OK",
  "Drivers de entrada (teclado/toque) .. OK",
  "Calibrando arena de combate ......... OK",
  `Carregando classes .................. ${CLASSES.length} unidades OK`,
  "Sincronizando recordes locais ....... OK",
  "Interface KUROVOID .................. pronta",
];

const DLC_LINES = [
  "ElecOS(R) Kernel 4.2.7 — expansao detectada",
  "Montando pacote HEROWAVE ............. 2.4 GB OK",
  "Verificando licenca de DLC ........... VALIDA",
  "Carregando dossies de herois ......... 13 OK",
  "Removendo rifle padrao do inventario . OK",
  "Recalibrando paleta: SETOR RUBRO ..... OK",
  "Sincronizando poderes unicos ......... 52 OK",
  "Interface HEROWAVE ................... pronta",
];

/** "Someone turning on ElecOS" — a short boot cutscene before the menu. */
export function BootScreen({ onDone, dlc }: { onDone: () => void; dlc?: boolean }) {
  const LINES = dlc ? DLC_LINES : BASE_LINES;
  const [count, setCount] = useState(0);
  const [pct, setPct] = useState(0);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const timers: number[] = [];
    LINES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setCount(i + 1), 260 + i * 300));
    });
    const start = performance.now();
    const iv = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / 3100);
      setPct(Math.floor(k * 100));
      if (k >= 1) window.clearInterval(iv);
    }, 40);
    timers.push(window.setTimeout(finish, 3500));
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(iv);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 flex cursor-pointer items-center justify-center px-5"
      style={{ background: dlc ? "#0b0205" : "#04050a" }}
      onPointerDown={finish}
      role="button"
      aria-label="Pular introducao"
    >
      <div className="w-full max-w-xl">
        <div className="flex items-end gap-3">
          <div className="font-display text-5xl font-bold italic tracking-tight text-white sm:text-6xl">
            Elec<span className="text-neon">OS</span>
          </div>
          {dlc && (
            <div className="notch-sm mt-2 inline-flex items-center gap-2 border border-[#ff4d5e]/50 bg-[#ff4d5e]/10 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.22em] text-[#ff6b78]">
              DLC HEROWAVE
            </div>
          )}
          <div className="pb-1.5 font-num text-[11px] tracking-[0.3em] text-white/35">v4.2.7</div>
        </div>

        <div className="mt-7 min-h-[216px] font-num text-[12px] leading-[1.9] text-[#9fd8c9] sm:text-[13px]">
          {LINES.slice(0, count).map((l, i) => (
            <div key={i} className="rise" style={{ animationDuration: "0.25s" }}>
              <span className="text-white/25">{String(i).padStart(2, "0")}</span>
              {"  "}
              {l}
              {i === count - 1 && i < LINES.length - 1 ? <span className="blink text-neon">_</span> : null}
            </div>
          ))}
          {count >= LINES.length && (
            <div className="mt-3 font-display text-sm font-bold tracking-[0.2em] text-neon">
              [ SISTEMA PRONTO ]
            </div>
          )}
        </div>

        <div className="mt-4 h-[3px] w-full bg-white/10">
          <div className="h-full bg-neon transition-[width] duration-100" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between font-num text-[10px] tracking-[0.25em] text-white/30">
          <span>CARREGANDO</span>
          <span>{pct}%</span>
        </div>

        <div className="mt-8 text-center font-num text-[10px] tracking-[0.3em] text-white/25">
          PRESSIONE QUALQUER TECLA PARA PULAR
        </div>
      </div>
    </div>
  );
}
