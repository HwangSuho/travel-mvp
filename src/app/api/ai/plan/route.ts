import { NextResponse } from "next/server";
import type { AiSuggestedBlock, ValidatedBlock } from "@/types/trip";

type PlanRequestBody = {
  destination: string;
  startDate: string;
  endDate: string;
  travelStyle?: string;
  pace?: string;
  budgetLevel?: string;
  mustVisit?: string[];
};

type GeminiPlanDay = {
  date: string;
  title?: string;
  daySummary?: string;
  blocks: AiSuggestedBlock[];
};

type GeminiPlan = {
  tripTitle: string;
  summary?: string;
  days: GeminiPlanDay[];
};

const MODEL_NAME = "models/gemini-2.0-flash";
const PLACES_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

const cleanJsonText = (text: string) =>
  text.replace(/```json/gi, "").replace(/```/g, "").trim();

const buildPrompt = (body: PlanRequestBody) => `
너는 여행 일정 설계 어시스턴트다. 아래 요구사항을 반드시 지켜라.
- 장소에 대해 제공할 정보는 placeName, placeQueryHint 뿐이다. 좌표/주소/평점/영업시간은 포함하지 않는다.
- placeQueryHint 는 Google Places Text Search에 바로 쓸 수 있는 문자열이어야 한다.
- 날짜별로 3~5개 블록을 제안하되, 시작/종료 시각과 카테고리를 포함한다.
- 응답은 JSON 형태여야 하며 추가 설명을 붙이지 말 것.
사용자 요청:
목적지: ${body.destination}
여행 기간: ${body.startDate} ~ ${body.endDate}
여행 스타일: ${body.travelStyle ?? "미정"}
이동 페이스: ${body.pace ?? "BALANCED"}
예산 레벨: ${body.budgetLevel ?? "MID"}
반드시 포함할 장소: ${(body.mustVisit ?? []).join(", ") || "없음"}

응답 스키마:
{
  "tripTitle": "제목",
  "summary": "요약",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "하루 제목",
      "daySummary": "간단 설명",
      "blocks": [
        {
          "startTime": "09:00",
          "endTime": "11:00",
          "category": "MORNING" | "LUNCH" | "AFTERNOON" | "DINNER" | "NIGHT",
          "placeName": "장소 이름",
          "placeQueryHint": "Google Places 검색용 키워드",
          "area": "주요 동네/지역",
          "memo": "메모"
        }
      ]
    }
  ]
}
`;

const validateRequest = (body: PlanRequestBody) => {
  if (!body.destination || !body.startDate || !body.endDate) {
    return "destination, startDate, endDate는 필수입니다.";
  }
  return null;
};

const validateWithPlaces = async (
  block: AiSuggestedBlock,
  apiKey: string
): Promise<ValidatedBlock> => {
  const query = block.placeQueryHint || block.placeName;
  if (!query) {
    return { ...block, validationStatus: "NOT_FOUND" };
  }

  const endpoint = new URL(PLACES_ENDPOINT);
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("language", "ko");
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error("Google Places 호출 실패");
    }
    const data = await response.json();
    const first = data.results?.[0];
    if (!first) {
      return { ...block, validationStatus: "NOT_FOUND" };
    }
    const location = first.geometry?.location;
    return {
      ...block,
      validationStatus: "VALID",
      placeId: first.place_id,
      lat: location?.lat,
      lng: location?.lng,
      rating: first.rating,
      address: first.formatted_address,
    };
  } catch (error) {
    console.error("Places 검증 오류", error);
    return { ...block, validationStatus: "ERROR" };
  }
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const placesApiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  if (!placesApiKey) {
    return NextResponse.json(
      { error: "Google Maps API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body: PlanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 JSON으로 파싱할 수 없습니다." },
      { status: 400 }
    );
  }

  const validationError = validateRequest(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent?key=${apiKey}`;
    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(body) }],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    const aiJson = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Gemini 호출 실패", aiJson);
      return NextResponse.json(
        { error: aiJson.error?.message ?? "AI 호출 실패", details: aiJson },
        { status: aiResponse.status }
      );
    }

    const textResponse =
      aiJson.candidates
        ?.flatMap((candidate: any) => candidate.content?.parts ?? [])
        .map((part: any) => part?.text ?? "")
        .join("") ?? "";

    if (!textResponse) {
      return NextResponse.json(
        { error: "AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const cleaned = cleanJsonText(textResponse);
    let parsed: GeminiPlan;
    try {
      parsed = JSON.parse(cleaned) as GeminiPlan;
    } catch (error) {
      console.error("Gemini JSON 파싱 실패", error, textResponse);
      return NextResponse.json(
        {
          error: "AI 응답을 JSON으로 파싱하지 못했습니다.",
          raw: textResponse,
          cleaned,
        },
        { status: 502 }
      );
    }

    if (!parsed.days?.length) {
      return NextResponse.json(
        { error: "AI가 생성한 일정에 day 정보가 없습니다." },
        { status: 502 }
      );
    }

    const validatedDays = [];
    for (const day of parsed.days) {
      const validatedBlocks = await Promise.all(
        (day.blocks ?? []).map((block) => validateWithPlaces(block, placesApiKey))
      );
      validatedDays.push({
        date: day.date,
        title: day.title,
        daySummary: day.daySummary,
        blocks: validatedBlocks,
      });
    }

    return NextResponse.json({
      tripTitle: parsed.tripTitle,
      summary: parsed.summary,
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      days: validatedDays,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "알 수 없는 오류";
    console.error("AI 일정 생성 실패", message, error);
    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다.", details: message },
      { status: 500 }
    );
  }
}
