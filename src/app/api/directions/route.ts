import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destinationLat = searchParams.get("destinationLat");
  const destinationLng = searchParams.get("destinationLng");
  const mode = searchParams.get("mode") || "transit";

  if (!originLat || !originLng || !destinationLat || !destinationLng) {
    return NextResponse.json(
      { error: "출발/도착 좌표가 필요합니다." },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/directions/json");
  endpoint.searchParams.set("origin", `${originLat},${originLng}`);
  endpoint.searchParams.set(
    "destination",
    `${destinationLat},${destinationLng}`
  );
  endpoint.searchParams.set("mode", mode);
  endpoint.searchParams.set("language", "ko");
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error("Google Directions API 호출에 실패했습니다.");
    }
    const data = await response.json();
    const route = data.routes?.[0];
    const leg = route?.legs?.[0];
    const result = {
      summary: route?.summary ?? "",
      distance: leg?.distance?.text ?? "",
      duration: leg?.duration?.text ?? "",
      warnings: route?.warnings ?? [],
    };
    return NextResponse.json({ route: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "경로 정보를 가져오지 못했습니다." },
      { status: 500 }
    );
  }
}
