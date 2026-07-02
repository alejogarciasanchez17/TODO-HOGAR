import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e8b763",
          fontSize: 300,
          fontWeight: 700,
          color: "#3a2a0f",
          fontFamily: "sans-serif",
        }}
      >
        t
      </div>
    ),
    { width: 512, height: 512 }
  );
}
