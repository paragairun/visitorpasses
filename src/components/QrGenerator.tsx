import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QrGeneratorProps {
  value: string;
  label: string;
  size?: number;
  wing?: string;
  /** Optional caption/text used when sharing via Web Share / WhatsApp / Telegram. */
  shareText?: string;
  /** Show the Share button (defaults to true). */
  showShare?: boolean;
}

const GOLD = "#C9A227";
const BG = "#0F121C";

const MANDLIK_WINGS = new Set(["A", "B", "C", "D", "E", "F"]);
const headerForWing = (wing?: string) =>
  wing && MANDLIK_WINGS.has(wing.trim().toUpperCase()) ? "MANDLIK NAGAR" : "TRIUMPH TOWER";

const QrGenerator = ({ value, label, size = 400, wing, shareText, showShare = true }: QrGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerText = headerForWing(wing);
  const { toast } = useToast();

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
      ctx.fillText(headerText, W / 2, 80);

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
  }, [value, size, headerText]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    // Short prefix derived from the header initials (e.g. "MANDLIK NAGAR" -> "mn")
    const slug = headerText
      .split(/\s+/)
      .map((w) => w.charAt(0).toLowerCase())
      .join("");
    // Use an opaque random identifier in the filename — never include
    // resident-identifying details (wing, flat, owner) for privacy.
    const rand =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().split("-")[0]
        : Math.random().toString(36).slice(2, 10);
    a.download = `${slug}-${rand}.png`;
    a.click();
  };

  const buildFilename = () => {
    const slug = headerText
      .split(/\s+/)
      .map((w) => w.charAt(0).toLowerCase())
      .join("");
    const rand =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().split("-")[0]
        : Math.random().toString(36).slice(2, 10);
    return `${slug}-${rand}.png`;
  };

  const canvasToBlob = () =>
    new Promise<Blob | null>((resolve) => {
      if (!canvasRef.current) return resolve(null);
      canvasRef.current.toBlob((b) => resolve(b), "image/png");
    });

  const handleShare = async () => {
    if (!canvasRef.current) return;
    const message = shareText ?? `${label}\n\nShow this QR at the gate for entry.`;
    const filename = buildFilename();
    const blob = await canvasToBlob();

    // Prefer native share with file (works on mobile WhatsApp, Telegram, etc.)
    try {
      if (blob && typeof navigator !== "undefined" && "canShare" in navigator) {
        const file = new File([blob], filename, { type: "image/png" });
        const nav = navigator as Navigator & {
          canShare?: (data: ShareData) => boolean;
          share?: (data: ShareData) => Promise<void>;
        };
        if (nav.canShare?.({ files: [file] }) && nav.share) {
          await nav.share({ files: [file], title: label, text: message });
          return;
        }
      }

      // Fallback: copy image to clipboard + open WhatsApp web with the message
      if (blob && typeof navigator !== "undefined" && "clipboard" in navigator && "ClipboardItem" in window) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          toast({
            title: "QR copied to clipboard",
            description: "Paste it into WhatsApp, Telegram or any chat app.",
          });
        } catch {
          // ignore clipboard failure
        }
      }

      // Final fallback: open WhatsApp share dialog with text only
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const aborted = (err as DOMException)?.name === "AbortError";
      if (!aborted) {
        toast({
          title: "Could not share",
          description: (err as Error)?.message ?? "Try downloading and sharing manually.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card border border-border">
      <canvas ref={canvasRef} className="rounded max-w-full h-auto" />
      <p className="text-sm font-medium text-card-foreground">{label}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload} className="touch-target gap-2">
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
        {showShare && (
          <Button variant="default" size="sm" onClick={() => void handleShare()} className="touch-target gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
};

export default QrGenerator;
