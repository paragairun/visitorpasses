import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrGeneratorProps {
  value: string;
  label: string;
  size?: number;
}

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6C65A";
const PLAQUE_BG = "#FAF6EC"; // ivory / cream (no black)
const INK = "#1A1A1A";

const QrGenerator = ({ value, label, size = 360 }: QrGeneratorProps) => {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Renders the full styled plaque onto a canvas (used for both preview & download)
  const renderPlaque = async (canvas: HTMLCanvasElement, scale = 1) => {
    const W = Math.round(560 * scale);
    const H = Math.round(700 * scale);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background plaque with rounded corners
    const radius = 28 * scale;
    ctx.fillStyle = PLAQUE_BG;
    roundRect(ctx, 0, 0, W, H, radius);
    ctx.fill();

    // Outer gold border
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4 * scale;
    roundRect(ctx, 8 * scale, 8 * scale, W - 16 * scale, H - 16 * scale, radius - 6 * scale);
    ctx.stroke();

    // Inner thin gold border
    ctx.strokeStyle = GOLD_LIGHT;
    ctx.lineWidth = 1 * scale;
    roundRect(ctx, 18 * scale, 18 * scale, W - 36 * scale, H - 36 * scale, radius - 14 * scale);
    ctx.stroke();

    // Header: TRIUMPH TOWER
    ctx.fillStyle = GOLD;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${44 * scale}px Georgia, "Times New Roman", serif`;
    ctx.fillText("TRIUMPH TOWER", W / 2, 70 * scale);

    // Decorative gold rule
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(120 * scale, 132 * scale);
    ctx.lineTo(W - 120 * scale, 132 * scale);
    ctx.stroke();

    // Generate QR onto an offscreen canvas
    const qrSize = 360 * scale;
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, value, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: INK, light: PLAQUE_BG },
    });
    const qrX = (W - qrSize) / 2;
    const qrY = 160 * scale;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // TT monogram center badge (covers QR center, but level H allows ~30% obstruction)
    const badgeSize = 64 * scale;
    const cx = W / 2;
    const cy = qrY + qrSize / 2;
    ctx.fillStyle = PLAQUE_BG;
    roundRect(ctx, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize, 8 * scale);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize, 8 * scale);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${36 * scale}px Georgia, serif`;
    ctx.fillText("TT", cx, cy + 2 * scale);

    // Bottom rule
    const footerTop = qrY + qrSize + 32 * scale;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(120 * scale, footerTop);
    ctx.lineTo(W - 120 * scale, footerTop);
    ctx.stroke();

    // Footer label (uppercased)
    ctx.fillStyle = INK;
    ctx.font = `700 ${20 * scale}px Georgia, serif`;
    ctx.textAlign = "center";
    const upper = label.toUpperCase();
    // Wrap if too long
    const maxWidth = W - 80 * scale;
    const lines = wrapText(ctx, upper, maxWidth);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, W / 2, footerTop + 32 * scale + i * 26 * scale);
    });
  };

  useEffect(() => {
    if (previewRef.current) {
      void renderPlaque(previewRef.current, 1).then(() => setReady(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, label, size]);

  const handleDownload = async () => {
    // Render at 2x for crisp print/download
    const off = document.createElement("canvas");
    await renderPlaque(off, 2);
    const url = off.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `triumph-tower-qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={previewRef}
        className="rounded-lg shadow-lg max-w-full h-auto"
        style={{ width: Math.min(size, 360) }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!ready}
        className="touch-target gap-2"
      >
        <Download className="h-4 w-4" />
        Download PNG
      </Button>
    </div>
  );
};

// Helpers
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default QrGenerator;
