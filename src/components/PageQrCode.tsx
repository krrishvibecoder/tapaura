import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Renders a downloadable QR code for the client's public link page. */
export function PageQrCode({ url, fileName }: { url: string; fileName: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(url, { width: 720, margin: 2, errorCorrectionLevel: "M" })
      .then((result) => {
        if (active) setDataUrl(result);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-border bg-white p-3">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${url}`} className="size-40" />
        ) : (
          <div className="size-40 animate-pulse rounded bg-muted" />
        )}
      </div>
      <p className="text-center text-xs break-all text-muted-foreground">{url}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!dataUrl}
        onClick={() => {
          if (!dataUrl) return;
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${fileName || "link-page"}-qr.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }}
      >
        <Download className="size-4" aria-hidden="true" />
        Download QR
      </Button>
    </div>
  );
}
