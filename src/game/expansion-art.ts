import type { ClassDef } from "./classes";

type Point = readonly [number, number];
const TAU = Math.PI * 2;
const TELEPATH_CAPE: readonly Point[] = [[15, -8], [15, 8], [0, 15], [-19, 10], [-12, 0], [-19, -10], [0, -15]];
const JEDI_ROBE: readonly Point[] = [[13, -10], [17, 0], [13, 10], [-13, 14], [-20, 7], [-15, 0], [-20, -7], [-13, -14]];
const CRYO_MANTLE: readonly Point[] = [[17, -8], [19, 0], [17, 8], [-4, 15], [-19, 10], [-13, 0], [-19, -10], [-4, -15]];

function polygon(ctx: CanvasRenderingContext2D, points: readonly Point[], fill: string, stroke: string, width = 1.5) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) ctx.moveTo(points[i][0], points[i][1]);
    else ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Local-space artwork: a few solid paths, no blur filters or extra particle loops.
export function drawExpansionCharacter(
  ctx: CanvasRenderingContext2D,
  cls: ClassDef,
  time: number,
  thrust: number,
  hurt: boolean,
  attacking: boolean,
) {
  ctx.save();
  ctx.lineJoin = "round";
  const rim = hurt ? "#ffffff" : cls.accent;

  if (cls.shape === "telepath") {
    const sway = Math.sin(time * 3.5) * (1 + thrust);
    ctx.strokeStyle = "#ba548e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-25, -15 + sway, -32 - thrust * 3, -11 + sway);
    ctx.moveTo(-10, 8); ctx.quadraticCurveTo(-25, 15 - sway, -32 - thrust * 3, 11 - sway);
    ctx.stroke();
    polygon(ctx, TELEPATH_CAPE, hurt ? "#ffd7ea" : "#642548", rim, 1.8);
    ctx.fillStyle = "#d078a7";
    ctx.fillRect(-9, -8, 9, 16);
    ctx.fillStyle = "#f7c9e6";
    ctx.fillRect(-4, -5, 2, 10);
    // Exposed head and a three-node neural crown instead of a helmet.
    ctx.fillStyle = "#dfafbe";
    ctx.beginPath(); ctx.ellipse(9, 0, 9, 8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#33162d"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(11, -5); ctx.lineTo(14, -3); ctx.moveTo(11, 5); ctx.lineTo(14, 3); ctx.stroke();
    ctx.strokeStyle = "#f3a1d6"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(7, 0, 10, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = "#fff0fa";
    ctx.beginPath();
    ctx.arc(7, -10, 2, 0, TAU); ctx.moveTo(-1, 0); ctx.arc(-3, 0, 2, 0, TAU);
    ctx.moveTo(9, 10); ctx.arc(7, 10, 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#d886bc"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(9, 0, 17 + Math.sin(time * 2) * 1.5, -0.8, 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(9, 0, 22 + Math.sin(time * 2) * 1.5, -0.6, 0.6); ctx.stroke();
    ctx.fillStyle = "#fff1fb";
    ctx.beginPath(); ctx.arc(8, -16, 3, 0, TAU); ctx.moveTo(11, 16); ctx.arc(8, 16, 3, 0, TAU); ctx.fill();
  } else if (cls.shape === "jedi") {
    // A green blade with a white core is readable even in low-effects mode.
    const swing = attacking ? Math.sin(time * 28) * 0.18 : 0;
    ctx.save(); ctx.translate(9, -14); ctx.rotate(-0.25 + swing);
    ctx.strokeStyle = "rgba(89,247,160,0.22)"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(37, 0); ctx.stroke();
    ctx.strokeStyle = "#67ffac"; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = "#f1fff5"; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = "#bacbc3"; ctx.fillRect(-5, -2.5, 10, 5);
    ctx.fillStyle = "#263c32"; ctx.fillRect(-3, -3, 2, 6); ctx.fillRect(2, -3, 2, 6);
    ctx.restore();
    polygon(ctx, JEDI_ROBE, hurt ? "#ffe9dc" : "#664937", "#c9ac87", 1.8);
    polygon(ctx, [[10, -8], [10, 8], [-7, 10], [-7, -10]], "#d3bb94", "#f2dfbd", 1);
    ctx.strokeStyle = "#81633f"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(9, -7); ctx.lineTo(-7, 4); ctx.moveTo(8, 7); ctx.lineTo(-7, -2); ctx.stroke();
    ctx.fillStyle = "#493223"; ctx.fillRect(-10, -11, 5, 22);
    ctx.fillStyle = "#d7c6a6"; ctx.fillRect(-9, -3, 3, 6);
    // Hood, face, and two calm eyes.
    ctx.fillStyle = "#392b24"; ctx.beginPath(); ctx.ellipse(9, 0, 10, 8.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#af8d64"; ctx.lineWidth = 1.7; ctx.stroke();
    ctx.fillStyle = "#d7b48b"; ctx.beginPath(); ctx.ellipse(12, 0, 5, 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#293a2f"; ctx.fillRect(13, -3.5, 2, 1.5); ctx.fillRect(13, 2, 2, 1.5);
    ctx.fillStyle = "#e7d6ba"; ctx.beginPath(); ctx.arc(4, -14, 3, 0, TAU); ctx.fill();
  } else if (cls.shape === "cryo") {
    polygon(ctx, CRYO_MANTLE, hurt ? "#e7f9ff" : "#245777", rim, 1.8);
    // Large asymmetrical crystal pauldrons establish the silhouette.
    polygon(ctx, [[-11, -10], [-15, -25], [-2, -17], [4, -10]], "#639fc5", "#d7f5ff");
    polygon(ctx, [[-11, 10], [-8, 22], [2, 16], [7, 8]], "#88c7e6", "#e1f8ff");
    ctx.strokeStyle = "#e5faff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-15, -25); ctx.lineTo(-5, -12); ctx.moveTo(-8, 22); ctx.lineTo(-4, 11); ctx.stroke();
    ctx.fillStyle = "#d4eff9"; ctx.fillRect(-10, -6, 6, 12);
    ctx.fillStyle = "#123149"; ctx.beginPath(); ctx.ellipse(10, 0, 9, 8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#accfe4"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#b8f4ff"; ctx.fillRect(10, -5, 5, 10);
    ctx.fillStyle = "#fffaff"; ctx.fillRect(13, -5, 2, 10);
    // Frost staff with a faceted, opaque spearhead.
    ctx.strokeStyle = "#acd8e9"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(25, 15); ctx.stroke();
    polygon(ctx, [[23, 15], [31, 8], [38, 15], [31, 21]], "#83bddb", "#efffff");
    ctx.strokeStyle = "#e9ffff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(31, 8); ctx.lineTo(31, 21); ctx.moveTo(23, 15); ctx.lineTo(38, 15); ctx.stroke();
  }
  ctx.restore();
}