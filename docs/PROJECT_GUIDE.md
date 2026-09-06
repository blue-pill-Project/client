# Blue Pill Client — 프로젝트 가이드

프론트엔드 클라이언트(`client`)의 구조, 도메인 흐름, 개발 진입점을 정리한 문서입니다.

---

## 1. 프로젝트 개요

**Blue Pill**은 AI 캐릭터와 함께하는 **로그(사진·대화) 기반 소셜** 서비스입니다.

클라이언트에서 다루는 핵심 도메인:

| 도메인 | 설명 |
|--------|------|
| **캐릭터 라이브러리** | 캐릭터 카드 탐색·생성·수정·삭제 |
| **로그방** | 캐릭터와 유저가 참여하는 방. 날짜/시간대별 사진 로그 + 채팅 |
| **피드** | 로그방에서 공유한 게시물 모아보기 |
| **프로필** | 내/타인 프로필, 공개 설정, 탈퇴 |

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| UI | React 19, TypeScript |
| 빌드 | Vite 8 |
| 라우팅 | React Router Dom 7 |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 전역 상태 | Zustand 5 |
| 유틸 | `clsx`, `tailwind-merge` (`cn`) |

패키지 스크립트:

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드
npm run lint
npm run preview
```

---

## 3. 환경 설정

루트에 `.env`가 없으면 프로덕션 API로 요청합니다.

```bash
# client/.env (gitignore 대상)
VITE_API_BASE_URL=http://localhost:8080/api
# 로컬 OAuth를 쓸 때만
# VITE_OAUTH2_BASE_URL=http://localhost:8080
```

상수 정의: `src/lib/config.ts`

| 상수 | 용도 |
|------|------|
| `BASE_URL` | REST API 베이스 |
| `OAUTH2_BASE_URL` | Google/Discord OAuth 인가 |
| `R2_DOMAIN` | Cloudflare R2 공개 이미지 도메인 |

---

## 4. 디렉터리 구조

```text
src/
├── main.tsx              # React 진입점 (BrowserRouter)
├── App.tsx               # 라우트 정의 + AuthInitializer + AuthModal
├── index.css             # 글로벌 스타일 / Tailwind
├── assets/               # 정적 에셋, API 스펙 메모(ExportBlock)
├── components/
│   ├── auth/             # 인증 모달, 가드, 가입 뷰
│   ├── character/        # 캐릭터 카드·상세 모달
│   ├── common/           # Button, Modal, SearchBar 등 디자인 시스템
│   ├── icons/            # SVG 아이콘
│   ├── layout/           # PageLayout, Sidebar
│   ├── log-rooms/        # 헤더·타임라인·채팅·업로드·게시물 모달
│   └── profile/          # 프로필 수정·탈퇴 모달
├── hooks/                # 라이브러리/업로드/삭제 등 커스텀 훅
├── lib/                  # API 클라이언트·도메인 API·캐시·유틸
├── pages/                # 라우트 단위 페이지
│   ├── auth/
│   ├── character/create|edit/
│   ├── design/           # 디자인 시스템 쇼케이스 (/design-system)
│   ├── library/          # 홈 = 캐릭터 라이브러리
│   ├── log-rooms/
│   └── profile/
└── store/                # Zustand (인증·모달)
```

문서 폴더:

```text
docs/
└── PROJECT_GUIDE.md      # 본 가이드
```

---

## 5. 라우팅

정의 위치: `src/App.tsx`

### 공개

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/`, `/library` | CharacterLibraryPage | 캐릭터 라이브러리(홈) |
| `/users/:publicId` | ProfilePage | 타인 프로필 |
| `/auth/callback` | CallbackPage | OAuth 콜백 |
| `/login` | LoginRedirectPage | 홈으로 보내고 로그인 모달 오픈 |
| `/design-system` | DesignPage | 컴포넌트 쇼케이스 |

### 보호 (`ProtectedRoute`)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/library/new` | CharacterCreationPage | 캐릭터 생성 |
| `/library/edit/:publicId` | CharacterEditPage | 캐릭터 수정 |
| `/profile` | ProfilePage | 내 프로필 |
| `/log-rooms` | LogRoomListPage | 내 로그방 목록 |
| `/log-rooms/new` | LogRoomCreationPage | 로그방 생성 |
| `/log-rooms/:publicId` | LogRoomPage | 로그방 상세(타임라인+채팅) |
| `/feed` | LogRoomPostListPage | 공유 게시물 피드 |

비로그인 시 `ProtectedRoute`는 로그인 모달을 열고 `/`로 리다이렉트합니다.

---

## 6. 인증 흐름

```text
소셜 로그인(Google/Discord)
  → OAuth 서버 리다이렉트
  → /auth/callback
  → reissueToken + getMyProfile
  → useAuthStore.setAuthenticated
  → 신규 유저면 signup-step1 모달
```

### 주요 파일

| 파일 | 역할 |
|------|------|
| `store/useAuthStore.ts` | 로그인 여부, 유저, Auth 모달 뷰 |
| `components/auth/AuthInitializer.tsx` | 앱 로드 시 세션 복구 (`/auth/callback`은 스킵) |
| `components/auth/AuthModal.tsx` | login / signup-step1·2 / success 뷰 전환 |
| `components/auth/ProtectedRoute.tsx` | 보호 라우트 가드 |
| `lib/token.ts` | accessToken localStorage, JWT에서 publicId 추출 |
| `lib/api.ts` | 공통 fetch, 401 시 재발급·실패 시 로그아웃 |
| `lib/authApi.ts` | logout, reissue, profile, withdraw 등 |

### 토큰

- Access token: `localStorage` (`token.ts`)
- Refresh: HttpOnly 쿠키 (`credentials: 'include'`)
- 401 → `/auth/reissue` → 원요청 재시도 → 실패 시 홈 + 로그인 모달

### 회원가입 모달 단계

1. **SignupStep1** — 약관 동의  
2. **SignupStep2** — 닉네임·프로필 이미지 (`updateProfile`, Skip도 빈 nickname으로 호출해 isNewUser 해소)  
3. **SignupSuccess** — 완료

---

## 7. 도메인별 기능

### 7.1 캐릭터 라이브러리

```text
목록(useCharacterLibrary)
  → 카드 클릭 → CharacterInfoModal
  → 소유자: 수정(/library/edit/:id) / 삭제(useDeleteCharacter)
  → 「로그방 만들기」 → /log-rooms/new (characterId state)
```

- **생성/수정**: 3단계 UI (설정 → 프롬프트 → 대화체 예시)
- 이미지는 **R2 업로드 필수** (`useR2Upload` + `imageType: CHARACTER`)
- API: `lib/characterApi.ts`

### 7.2 로그방

```text
목록 → 생성(캐릭터 선택) → 상세
상세 = LogRoomHeader + LogTimeline + ChatPanel
```

**타임라인**

- 날짜 + 3시간 슬롯(6, 9, 12, 15, 18, 21, 24, 3)
- 현재 슬롯·방장만 사진 업로드
- 공유된 슬롯은 추가 업로드 차단

**채팅**

- 메시지 5초 디바운스 **배치 전송** (`LogRoomPage.flushPendingChats`)
- 사진 답장(`quotedPhotoPublicId`)은 즉시 flush
- 서버가 여러 유저 메시지를 하나로 합치면 → `chatBatchCache`로 말풍선 복원
- 사진 답장 메타는 `photoReplyCache`(sessionStorage)로 유지
- AI 답장은 전송 후 폴링(`waitForAiReply`, 약 30초)

**공유**

- `shareLog` → 피드(`/feed`)에 노출
- `PostDetailModal`에서 본인 게시물 삭제 가능

API: `lib/logRoomApi.ts`

### 7.3 프로필

- URL에 `publicId` 없으면 본인, 있으면 타인
- 본인: 공개 여부 Switch, 수정 모달, 탈퇴 모달
- 해당 유저 캐릭터 그리드: `useUserCharacterCards`

### 7.4 이미지 업로드

1. `getPresignedUrl(imageType)` — `PROFILE` | `CHARACTER` | `LOG`
2. `useR2Upload.uploadToR2` — presigned URL로 PUT
3. API에는 R2 경로/키만 전달 (도메인 이중 결합 주의 — 수정 시 기존 URL 재전송 안 함)

---

## 8. API / 데이터 레이어

### 공통 클라이언트 (`lib/api.ts`)

```ts
api.get / api.post / api.put / api.patch / api.delete
```

- Authorization Bearer 자동 부착
- 응답 `{ data: ... }` 언래핑
- 204 No Content 처리

### 도메인 API 모듈

| 파일 | 담당 |
|------|------|
| `authApi.ts` | 로그인·프로필·탈퇴·구독 |
| `characterApi.ts` | 캐릭터 CRUD·라이브러리·자동완성 |
| `logRoomApi.ts` | 로그방·일별 로그·채팅·공유·사진 |
| `imageApi.ts` | R2 presigned URL |

### 클라이언트 캐시

| 파일 | 용도 |
|------|------|
| `chatBatchCache.ts` | 배치 저장된 유저 메시지를 개별 말풍선으로 복원 |
| `photoReplyCache.ts` | 사진 답장 quotedPhotoPublicId 유지 |

---

## 9. 훅 & 스토어

| 훅/스토어 | 역할 |
|-----------|------|
| `useAuthStore` | 인증·Auth 모달 전역 상태 |
| `useCharacterLibrary` | 공개 라이브러리 목록(검색·정렬·더보기) |
| `useUserCharacterCards` | 특정 유저 캐릭터 목록 |
| `useDeleteCharacter` | confirm 후 삭제 |
| `useR2Upload` | R2 PUT 업로드 |
| `useApi` | 제네릭 mutation(post/put/patch/delete) |

---

## 10. UI / 레이아웃

- **PageLayout**: Sidebar + 메인 스크롤 영역
- **Sidebar**: 홈 · 로그방 · 피드 · 프로필 (모바일은 하단 탭)
- **common/**: Button, TextInput, Modal, Chip, Dropdown, Switch, Tabs, SearchBar, MonthCalendar 등
- 디자인 토큰: `tailwind.config.ts`, 쇼케이스: `/design-system`

유틸 (`lib/utils.ts`):

- `cn` — className 병합
- `getImageUrl` — R2 상대 경로 → 절대 URL
- `getErrorMessage` — API 에러 메시지 추출
- `isMobile` — ≤1024px

---

## 11. 주요 사용자 시나리오

### A. 첫 로그인

1. 사이드바 또는 보호 페이지 접근 → AuthModal(login)
2. Google/Discord → `/auth/callback`
3. 신규면 약관·닉네임 → 라이브러리 홈

### B. 캐릭터 만들고 로그방 열기

1. `/library/new`에서 캐릭터 생성
2. 라이브러리 카드 → 「로그방 만들기」
3. `/log-rooms/new`에서 관계·공개 설정 후 생성
4. `/log-rooms/:publicId`에서 사진·채팅

### C. 로그 공유 → 피드

1. 로그방 헤더에서 해당 슬롯 공유
2. `/feed`에서 방별 컬럼으로 게시물 확인
3. 클릭 → PostDetailModal

---

## 12. 개발 시 참고

### 주의할 구현 디테일

- **날짜 키**: UTC `toISOString()` 대신 로컬 `YYYY-MM-DD` (`getLocalDateKey`) — KST 자정~오전 어긋남 방지
- **채팅 입력**: IME(한글) composition 중 Enter는 전송하지 않음
- **채팅 스크롤**: prepend(이전 페이지) 시 scrollHeight로 위치 보정
- **캐릭터 수정**: 새 이미지 없으면 `imageUrl` 필드 미전송
- **AuthInitializer vs CallbackPage**: 콜백 경로에서는 초기화가 세션을 건드리지 않음

### 코드 주석

주요 페이지·API·훅·컴포넌트에 한국어 JSDoc이 달려 있습니다.  
함수 단위 동작은 각 파일 상단/`/** */` 주석을 참고하세요.

### API 스펙 메모

Notion 등에서보낸 엔드포인트 메모가  
`src/assets/ExportBlock-.../` 아래에 md로 있습니다.  
런타임 코드의 단일 소스는 `src/lib/*Api.ts`입니다.

---

## 13. 빠른 파일 맵

| 하고 싶은 일 | 볼 파일 |
|--------------|---------|
| 라우트 추가 | `App.tsx` |
| API 엔드포인트 | `lib/*Api.ts`, `lib/api.ts` |
| 로그인/모달 | `store/useAuthStore.ts`, `components/auth/` |
| 캐릭터 UI | `pages/character/`, `components/character/` |
| 로그방 핵심 로직 | `pages/log-rooms/LogRoomPage.tsx` |
| 채팅 UI | `components/log-rooms/ChatPanel.tsx` |
| 피드 | `pages/log-rooms/LogRoomPostListPage.tsx` |
| 버튼/입력 등 | `components/common/` |
| 환경 URL | `lib/config.ts` |

---

## 14. 관련 문서

- 루트 `README.md` — 스택·설치·간단 기능 소개
- 본 문서 `docs/PROJECT_GUIDE.md` — 구조·흐름·개발 가이드
