import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const type = searchParams.get("type");
  const openNow = searchParams.get("openNow") === "true";
  const maxPrice = searchParams.get("maxPrice");
  const radius = searchParams.get("radius");
  const locationLat = searchParams.get("lat");
  const locationLng = searchParams.get("lng");

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력해 주세요." },
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

  const endpoint = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  if (locationLat && locationLng && radius) {
    endpoint.searchParams.set("location", `${locationLat},${locationLng}`);
    endpoint.searchParams.set("radius", radius);
  } else {
    endpoint.searchParams.set("query", query);
  }
  endpoint.searchParams.set("language", "ko");
  endpoint.searchParams.set("key", apiKey);
  if (type) endpoint.searchParams.set("type", type);
  if (openNow) endpoint.searchParams.set("opennow", "true");
  if (maxPrice) endpoint.searchParams.set("maxprice", maxPrice);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error("Google Places API 호출에 실패했습니다.");
    }
    type GooglePlace = {
      place_id: string;
      name: string;
      formatted_address?: string;
      rating?: number;
      user_ratings_total?: number;
      price_level?: number;
      opening_hours?: { open_now?: boolean };
      types?: string[];
      geometry?: { location?: { lat: number; lng: number } };
    };
    const data: { results?: GooglePlace[] } = await response.json();
    const results =
      data.results?.map((item) => ({
        id: item.place_id,
        name: item.name,
        formattedAddress: item.formatted_address,
        rating: item.rating,
        reviews: item.user_ratings_total,
        priceLevel: item.price_level,
        openNow: item.opening_hours?.open_now ?? false,
        types: item.types ?? [],
        location: item.geometry?.location,
      })) ?? [];
    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "장소 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
