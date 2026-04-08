import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrGeneratorProps {
  value: string;
  label: string;
  size?: number;
}

const QrGenerator = ({ value, label, size = 200 }: QrGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      });
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card border border-border">
      <canvas ref={canvasRef} className="rounded" />
      <p className="text-sm font-medium text-card-foreground">{label}</p>
      <Button variant="outline" size="sm" onClick={handleDownload} className="touch-target gap-2">
        <Download className="h-4 w-4" />
        Download PNG
      </Button>
    </div>
  );
};

export default QrGenerator;
