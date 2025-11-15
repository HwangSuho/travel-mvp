# Trip-Mate Web MVP

Trip-Mate(트립메이트)는 여행자가 한 화면에서 **일정·장소·메모**를 관리할 수 있도록 돕는 글로벌 여행 플래너입니다.  
Phase 1 Web MVP에서는 **로그인 → 일정 리스트 → 일정 편집 + 지도/장소 검색**까지의 흐름을 웹에서 직접 체험할 수 있게 구성했습니다.

## 라우트 구조

- `/` – 랜딩 페이지. Trip-Mate 소개와 CTA 버튼으로 로그인으로 유도합니다.
- `/login` – Firebase Auth 기반 이메일/비밀번호 및 Google 로그인 UI.
- `/dashboard` – 나의 여행 일정 카드 목록. TripContext로 상태를 관리하며 추후 Firestore 데이터와 연동됩니다.
- `/plan/[id]` – 특정 일정 편집 화면. 좌측은 Day/Block 타임라인, 우측은 Google Maps + Places 검색 패널입니다.

## 기술 스택

- **Framework**: Next.js (App Router) + TypeScript  
- **UI/스타일**: React Server/Client Components, Tailwind CSS, 커스텀 UI 컴포넌트(Button/Card/Tag)  
- **상태 관리**: React Context(`AuthContext`, `TripContext`), Firebase Auth 상태와 연동  
- **데이터**: Firebase Firestore(서비스 레이어), 목업 데이터 fallback  
- **지도/장소**: Google Maps JavaScript API, Places Text Search & Directions API  
- **기타**: 커스텀 Google Maps 스크립트 로더, ESLint, Node 20 환경

## 환경 변수 (.env.local)

다음 키를 `.env.local`에 추가한 뒤 실제 값을 입력해 주세요. 값 예시는 Firebase 콘솔/Google Cloud Console에서 발급한 문자열을 사용하면 됩니다.

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXX" # 선택

# Google Maps / Places
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="browser-api-key"
GOOGLE_MAPS_API_KEY="server-api-key" # API Route 프록시에서 사용
```

> ⚠️ API 키는 절대 코드에 직접 하드코딩하지 말고 `.env.local`에만 보관하세요.

## 개발 환경 및 실행

1. **Node 20 이상**을 사용합니다. (예: `PATH=/home/.../node-v20.11.1-linux-x64/bin:$PATH`)
2. 의존성 설치  
   ```bash
   npm install
   ```
3. 개발 서버  
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 접속
4. Lint  
   ```bash
   npm run lint
   ```

## 사용 흐름 (Phase 1)

1. `/login`에서 이메일/비밀번호로 가입하거나 Google 로그인 버튼으로 인증합니다.  
2. `/dashboard`에서 목업 일정이 카드 형태로 표시되며, TripContext가 Firebase/Firestore와 동기화를 시도합니다.  
3. 카드 선택 시 `/plan/[id]` 화면에서 Day/Block 타임라인 편집 UI와 우측 지도/장소 검색 패널을 볼 수 있습니다.  
4. 우측 패널에서 장소를 검색하면 Google Places 결과를 평점/리뷰/가격대/영업여부로 확인할 수 있으며, “일정에 추가” 버튼을 누르면 해당 Day의 타임라인에 장소가 즉시 추가됩니다. 위치가 2개 이상일 경우 “이동 시간 계산”으로 Google Directions API 기반 예상 이동 시간을 확인할 수 있습니다.

### Google Places/Directions 연동

- `/api/places/search`는 `type`, `openNow`, `maxPrice` 파라미터를 받아 다양한 추천을 제공합니다. 평점/리뷰/가격대/영업여부가 결과로 내려옵니다.
- `/api/directions` Next.js API Route가 Google Directions API를 호출합니다. 필요 파라미터: `originLat`, `originLng`, `destinationLat`, `destinationLng`, `mode` (선택, 기본 transit)
- `/plan/[id]`의 “이동 시간 계산”은 위치 정보가 있는 일정이 2개 이상일 때 호출하며, 거리/시간/요약을 UI에 표시합니다.

### Google Directions API 연동

- `/api/directions` Next.js API Route가 Google Directions API를 호출합니다.  
- 필요 파라미터: `originLat`, `originLng`, `destinationLat`, `destinationLng`, `mode` (선택, 기본 transit)  
- 프론트엔드(`PlanClient`)는 위치 정보가 있는 일정이 2개 이상일 때 호출하며, 거리/시간/요약을 UI에 표시합니다.

## 앞으로의 확장 로드맵

- **Firestore 완전 연동**: Trip CRUD를 실데이터 기반으로 저장/동기화  
- **Google Directions API**: 일정 간 이동 시간/경로 분석 및 동선 최적화  
- **Places 예약/메모 연동**: 장소 세부정보 저장, 공유 링크 생성  
- **예산 관리(F-4)**: 수동 지출 기록, 차후 자동 예산 계산  
- **캘린더/공유(F-8)**: Google Calendar Sync, 공유 링크 개선  
- **Smart Planner 단계**: 추천 일정, Drag & Drop 최적화, 번역/편의 기능

Phase 1 단계에서는 위 기능을 순차적으로 정비하면서 안정적인 로그인/일정 편집/지도 연동 경험을 다듬는 것을 목표로 합니다.
