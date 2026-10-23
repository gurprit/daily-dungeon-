import type { Achievement } from "./achievements";

export type CertificateData = {
  dungeon: string;
  day: string;
  number: number;
  resultTitle: string;
  roomsPassed: number;
  heartsLeft: number;
  achievements: Achievement[];
};

const WIDTH = 1080;
const HEIGHT = 1350;

function center(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, color: string, family = "Georgia") {
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = "bold " + size + "px " + family;
  ctx.fillText(text, WIDTH / 2, y, WIDTH - 170);
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    const n = visible.length - 1;
    while (ctx.measureText(visible[n] + "…").width > maxWidth && visible[n].length > 0) visible[n] = visible[n].slice(0, -1);
    visible[n] += "…";
  }
  ctx.textAlign = "center";
  visible.forEach((value, i) => ctx.fillText(value, WIDTH / 2, y + i * lineHeight, maxWidth));
  return y + visible.length * lineHeight;
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI * i / 4 - Math.PI / 2;
    const length = i % 2 === 0 ? radius : radius * .37;
    const px = x + Math.cos(angle) * length;
    const py = y + Math.sin(angle) * length;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Builds a high-resolution PNG in the browser, without an extra AI request. */
export async function createCertificateImage(data: CertificateData): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot create the certificate.");

  ctx.fillStyle = "#191922";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#25212a";
  ctx.fillRect(24, 24, WIDTH - 48, HEIGHT - 48);
  ctx.strokeStyle = "#d8ae6d";
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, WIDTH - 84, HEIGHT - 84);
  ctx.strokeStyle = "#6f5541";
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, WIDTH - 116, HEIGHT - 116);

  const halo = ctx.createRadialGradient(WIDTH / 2, 400, 40, WIDTH / 2, 400, 560);
  halo.addColorStop(0, "#463743");
  halo.addColorStop(1, "#25212a");
  ctx.fillStyle = halo;
  ctx.fillRect(66, 66, WIDTH - 132, 1030);

  ctx.fillStyle = "#d9b579";
  star(ctx, WIDTH / 2, 142, 31);
  star(ctx, 120, 140, 12);
  star(ctx, WIDTH - 120, 140, 12);
  center(ctx, "THE DAILY DUNGEON", 240, 42, "#e8cd9c");
  center(ctx, "OFFICIAL CERTIFICATE OF QUESTIONABLE HEROISM", 300, 24, "#e0b56d", "Arial");
  center(ctx, "Awarded for surviving (or spectacularly failing)", 390, 27, "#d0c3b3");
  center(ctx, data.dungeon, 432, 27, "#d0c3b3");

  ctx.strokeStyle = "#806b55";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(185, 475); ctx.lineTo(895, 475); ctx.stroke();
  center(ctx, data.resultTitle, 565, 54, "#f5e4c8");
  center(ctx, data.roomsPassed + "/3 ROOMS CLEARED   •   " + data.heartsLeft + "/3 HEARTS REMAINING", 618, 23, "#d0b487", "Arial");

  const awards = data.achievements.slice(0, 3);
  center(ctx, awards.length ? "HONOURS BESTOWED" : "OFFICIAL VERDICT", 715, 27, "#e0b56d", "Arial");
  if (awards.length) {
    let y = 788;
    for (const award of awards) {
      ctx.fillStyle = "#dfb77e";
      star(ctx, 210, y - 15, 15);
      ctx.font = "bold 32px Georgia";
      ctx.fillStyle = "#f2ddba";
      y = wrap(ctx, award.title, y, 640, 39, 2);
      ctx.fillStyle = "#bdb4b7";
      ctx.font = "25px Georgia";
      y = wrap(ctx, award.description, y + 4, 750, 32, 2) + 25;
    }
  } else {
    ctx.fillStyle = "#bdb4b7";
    ctx.font = "28px Georgia";
    wrap(ctx, "The Dungeon Master is still deciding whether to be impressed.", 791, 730, 38, 3);
  }

  ctx.fillStyle = "#d9b579";
  star(ctx, 195, 1160, 12);
  star(ctx, 885, 1160, 12);
  center(ctx, "DUNGEON #" + String(data.number).padStart(3, "0") + "   •   " + data.day, 1180, 22, "#d7c5ad", "Arial");
  center(ctx, "ONE DUNGEON. ENDLESS POSSIBILITIES.", 1235, 20, "#b69d77", "Arial");

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error("Unable to save certificate.")), "image/png");
  });
  return new File([blob], "daily-dungeon-" + data.day + "-certificate.png", { type: "image/png" });
}
