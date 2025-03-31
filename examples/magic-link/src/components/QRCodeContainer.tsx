"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRCodeContainerProps {
  url: string;
}

export function QRCodeContainer({ url }: QRCodeContainerProps) {
  const [qr, setQr] = useState<string>();

  useEffect(() => {
    QRCode.toDataURL(url)
      .then(setQr)
      .catch((error) => console.error(error));
  }, [url]);

  return (
    <div className="border-2 border-blue-600 p-6 rounded-lg flex flex-col gap-4">
      {qr ? (
        <img src={qr} alt="QR Code" className="w-96 h-96 rounded" />
      ) : (
        <div className="w-96 h-96 bg-white rounded-lg flex items-center justify-center">
          Loading...
        </div>
      )}

      <button
        onClick={() => navigator.clipboard.writeText(url)}
        className="bg-blue-600 text-white py-1.5 px-3 text-sm rounded-md"
      >
        Copy link
      </button>
    </div>
  );
}
