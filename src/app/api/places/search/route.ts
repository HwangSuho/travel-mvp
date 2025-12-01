import { NextResponse } from "next/server";

const PLACES_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const type = searchParams.get("type");
  const openNow = searchParams.get("openNow") === "true";
  const maxPrice = searchParams.get("maxPrice");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");

  const hasQuery = Boolean(query && query.trim());
  const hasLocation = Boolean(lat && lng && radius);

  if (!hasQuery && !hasLocation) {
    return NextResponse.json(
      { error: "검색어 또는 위치 좌표가 필요합니다." },
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

  const endpoint = new URL(PLACES_ENDPOINT);
  if (hasQuery) {
    endpoint.searchParams.set("query", query!.trim());
  }
  if (hasLocation) {
    endpoint.searchParams.set("location", `${lat},${lng}`);
    endpoint.searchParams.set("radius", radius!);
  }
  if (type) endpoint.searchParams.set("type", type);
  if (openNow) endpoint.searchParams.set("opennow", "true");
  if (maxPrice) endpoint.searchParams.set("maxprice", maxPrice);
  endpoint.searchParams.set("language", "ko");
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error("Google Places API 호출에 실패했습니다.");
    }

    const data = await response.json();

    if (data.error_message) {
      return NextResponse.json(
        { error: data.error_message },
        { status: 502 }
      );
    }

    const results =
      data.results?.map((item: any) => ({
        placeId: item.place_id as string,
        name: item.name as string,
        lat: item.geometry?.location?.lat as number | undefined,
        lng: item.geometry?.location?.lng as number | undefined,
        rating: item.rating as number | undefined,
        userRatingsTotal: item.user_ratings_total as number | undefined,
        priceLevel: item.price_level as number | undefined,
        address: item.formatted_address as string | undefined,
        openNow: item.opening_hours?.open_now as boolean | undefined,
        types: item.types as string[] | undefined,
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
