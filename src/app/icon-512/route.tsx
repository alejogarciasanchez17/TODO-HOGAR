import { ImageResponse } from "next/og";
import { logoDataUri } from "@/lib/logo";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={512} height={512} />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
