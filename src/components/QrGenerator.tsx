import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QrGeneratorProps {
  value: string;
  label: string;
  size?: number;
  /** Society name to display as the QR header. Falls back to a generic label if not provided. */
  societyName?: string | null;
  /** Optional caption/text used when sharing via Web Share / WhatsApp / Telegram. */
  shareText?: string;
  /** Show the Share button (defaults to true). */
  showShare?: boolean;
  /** Optional base name for downloaded/shared file (without extension). Sanitized automatically. */
  fileBaseName?: string;
}

const GOLD = "#C9A227";
const DARK = "#0F121C";
const BG = GOLD;
const FG = DARK;
const TEXT = "#000000";

/**
 * Wraps `text` to fit within `maxWidth`, shrinking the font size as needed.
 * Returns the lines to render and the font size that fits.
 */
const fitHeaderText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxFontSize: number,
  minFontSize: number,
  fontFamily: string,
) => {
  const words = text.trim().split(/\s+/).filter(Boolean);

  const wrapAtSize = (fontSize: number) => {
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    const lines = wrapAtSize(fontSize);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const widestLine = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (totalHeight <= maxHeight && widestLine <= maxWidth) {
      return { lines, fontSize, lineHeight };
    }
  }

  // Fall back to the minimum size even if it overflows slightly
  const lines = wrapAtSize(minFontSize);
  return { lines, fontSize: minFontSize, lineHeight: minFontSize * 1.2 };
};

const QrGenerator = ({ value, label, size = 400, societyName, shareText, showShare = true, fileBaseName }: QrGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerText = (societyName?.trim() || "VISITOR PASS").toUpperCase();
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
        color: { dark: FG, light: BG },
      });
      const qw = qrCanvas.width;
      const qh = qrCanvas.height;

      // Compose final canvas
      const padX = 60;
      const headerH = 130;
      const footerH = 100;
      const W = qw + padX * 2;

      // Figure out header text layout (wrap + auto-size) to fit within the fixed header box
      const headerMaxWidth = W - padX * 2;
      const headerFont = '"Philosopher", serif';
      const measureCanvas = document.createElement("canvas");
      const tempCtx = measureCanvas.getContext("2d")!;
      const { lines: headerLines, fontSize: headerFontSize, lineHeight: headerLineHeight } = fitHeaderText(
        tempCtx,
        headerText,
        headerMaxWidth,
        headerH - 30,
        56,
        16,
        headerFont,
      );
      const headerTextHeight = headerLines.length * headerLineHeight;

      const H = qh + headerH + footerH;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = TEXT;
      ctx.font = `700 ${headerFontSize}px ${headerFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const headerBlockTop = (headerH - headerTextHeight) / 2;
      headerLines.forEach((line, i) => {
        const baselineY = headerBlockTop + headerLineHeight * (i + 1) - headerLineHeight * 0.25;
        ctx.fillText(line, W / 2, baselineY);
      });

      // Divider
      ctx.strokeStyle = TEXT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, headerH - 10);
      ctx.lineTo(W - padX, headerH - 10);
      ctx.stroke();

      // QR
      ctx.drawImage(qrCanvas, padX, headerH);

      // Footer line 1: continuous solid lines spanning QR width with EXCLUSIVE centered
      ctx.font = `600 20px "Montserrat", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = TEXT;
      const label1 = "EXCLUSIVE";
      const labelGap = 16; // px gap between text and lines on each side
      const labelW = ctx.measureText(label1).width;
      const fy1 = headerH + qh + 28;
      ctx.fillText(label1, W / 2, fy1);
      const lineLeftStart = padX;
      const lineLeftEnd = W / 2 - labelW / 2 - labelGap;
      const lineRightStart = W / 2 + labelW / 2 + labelGap;
      const lineRightEnd = W - padX;
      ctx.strokeStyle = TEXT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineLeftStart, fy1);
      ctx.lineTo(lineLeftEnd, fy1);
      ctx.moveTo(lineRightStart, fy1);
      ctx.lineTo(lineRightEnd, fy1);
      ctx.stroke();

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

  const buildFilename = () => {
    const slug = headerText
      .split(/\s+/)
      .map((w) => w.charAt(0).toLowerCase())
      .join("");
    const sanitize = (s: string) =>
      s.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (fileBaseName) {
      const clean = sanitize(fileBaseName);
      if (clean) return `${slug}-${clean}.png`;
    }
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

  const handleDownload = async () => {
    const blob = await canvasToBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
        <Button variant="outline" size="sm" onClick={() => void handleDownload()} className="touch-target gap-2">
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
