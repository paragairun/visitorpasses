import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrGeneratorProps {
  value: string;
  label: string;
  size?: number;
}

const GOLD = "#C9A227";
const BG = "#0F121C";

const QrGenerator = ({ value, label, size = 400 }: QrGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Generate QR onto an offscreen canvas
      const qrCanvas = document.createElement("canvas");
      await QRCode.toCanvas(qrCanvas, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: GOLD, light: BG },
      });
      const qw = qrCanvas.width;
      const qh = qrCanvas.height;

      // Draw centered TT (no border) on QR
      const qctx = qrCanvas.getContext("2d")!;
      const cx = qw / 2;
      const cy = qh / 2;
      const clear = Math.round(qw * 0.13);
      qctx.fillStyle = BG;
      qctx.fillRect(cx - clear, cy - clear, clear * 2, clear * 2);
      qctx.fillStyle = GOLD;
      qctx.font = `700 ${Math.round(clear * 1.3)}px "Philosopher", serif`;
      qctx.textAlign = "center";
      qctx.textBaseline = "middle";
      qctx.fillText("TT", cx, cy + 2);

      // Compose final canvas
      const padX = 60;
      const headerH = 130;
      const footerH = 100;
      const W = qw + padX * 2;
      const H = qh + headerH + footerH;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = GOLD;
      ctx.font = `700 56px "Philosopher", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("TRIUMPH TOWER", W / 2, 80);

      // Divider
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, headerH - 10);
      ctx.lineTo(W - padX, headerH - 10);
      ctx.stroke();

      // QR
      ctx.drawImage(qrCanvas, padX, headerH);

      // Footer line 1: dashes spanning QR width with EXCLUSIVE centered
      ctx.font = `600 20px "Montserrat", sans-serif`;
      ctx.textBaseline = "middle";
      const label1 = "  EXCLUSIVE  ";
      const labelW = ctx.measureText(label1).width;
      const dashW = ctx.measureText("—").width;
      const sidePx = Math.max(0, (qw - labelW) / 2);
      const n = Math.max(1, Math.floor(sidePx / dashW));
      const dashes = "—".repeat(n);
      const fy1 = headerH + qh + 28;
      ctx.fillText(`${dashes}${label1}${dashes}`, W / 2, fy1);

      // Footer line 2
      ctx.fillText("VEHICLE ACCESS", W / 2, fy1 + 32);
    };

    // Wait for fonts to be ready so first paint isn't fallback typography
    const fontsReady = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(render);
    } else {
      void render();
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `triumph-tower-qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card border border-border">
      <canvas ref={canvasRef} className="rounded max-w-full h-auto" />
      <p className="text-sm font-medium text-card-foreground">{label}</p>
      <Button variant="outline" size="sm" onClick={handleDownload} className="touch-target gap-2">
        <Download className="h-4 w-4" />
        Download PNG
      </Button>
    </div>
  );
};

export default QrGenerator;
