# Project Blue-Pill (Client)

Project Blue-Pill의 프론트엔드 클라이언트 프로젝트입니다. 디자인 시스템 파운데이션과 현대적인 스택을 기반으로 구축되었습니다.

## 🛠 Tech Stack

### Core
- **React 19**: 최신 React 기능을 활용한 컴포넌트 기반 UI 개발
- **Vite 6**: 초고속 빌드 도구 및 개발 서버
- **TypeScript**: 정적 타이핑을 통한 코드 안정성 확보
- **React Router Dom 7**: 클라이언트 사이드 라우팅 및 보호된 경로 처리

### Styling & Design System
- **Tailwind CSS v4**: 최신 v4 엔진 및 `@tailwindcss/vite` 플러그인 연동
- **Design Tokens**: `tailwind.config.ts`를 통한 커스텀 파운데이션 설정 (Typography, Color Palette 등)
- **High-Fidelity UI**: 다크 모드 기반의 세련되고 인터랙티브한 사용자 경험

### State Management
- **Zustand 5**: 가볍고 유연한 상태 관리 (인증, 모달 상태 등)

## ✨ Key Features

### 1. Character Library & Creation
- 유저가 직접 캐릭터를 설계하고 생성할 수 있는 인터페이스 제공 (이미지 등록 필수, 예시 대화 편집 등)
- 생성된 캐릭터 카드 목록 조회, 수정(생성 페이지와 동일한 UI), 삭제 (삭제 시 목록에서 즉시 반영)
- 프로필 페이지에서 본인/타인이 만든 캐릭터 카드 모아보기

### 2. Log Rooms
- **Log Room List**: 참여 중인 로그방 목록을 고해상도 카드 인터페이스로 확인 (스켈레톤 로딩 적용)
- **Log Room Creation**: 실시간 미리보기(Live Preview) 기능을 지원하는 2단 레이아웃 기반의 생성 폼
- **Character Integration**: 라이브러리의 캐릭터를 선택하여 로그방의 페르소나로 지정
- **Timeline & Photo Log**: 날짜/3시간 단위 타임슬롯 기반 사진 업로드, 미래 시점은 선택 불가
- **Shared Feed**: 로그방에서 공유한 게시물을 홈 피드(전체) 및 방별 피드에서 조회, 본인 게시물 삭제 가능
- **Chat Panel**: 로그방 내 실시간 채팅, 사진 답장(quote) 지원

### 3. Authentication & Security
- **OAuth2 연동**: Google, Discord 로그인을 통한 손쉬운 가입 및 접속
- **Protected Routes**: 인증되지 않은 사용자의 특정 페이지 접근을 제한하고 자동 로그인 유도
- **Session Persistence**: 새로고침 시에도 중단 없는 인증 상태 유지 (깜빡임 현상 최적화)

## 📁 Project Structure

```text
src/
├── assets/          # 정적 에셋 (이미지, 디자인 리소스)
├── components/      # 공통 컴포넌트 및 도메인별 컴포넌트
│   ├── auth/        # 인증 관련 (AuthModal, ProtectedRoute 등)
│   ├── character/   # 캐릭터 카드/상세 모달
│   ├── common/      # 공용 UI (Button, SearchBar, TextInput, MonthCalendar 등)
│   ├── layout/      # 레이아웃 구성 (Sidebar, PageLayout)
│   ├── log-rooms/   # 로그방 헤더/타임라인/채팅/게시물 상세 모달
│   └── profile/     # 프로필 수정/회원 탈퇴 모달
├── hooks/           # 커스텀 훅 (API 연동 및 로직 재사용)
├── lib/             # API 클라이언트 및 공통 유틸리티 (api.ts, config.ts, *Api.ts, utils.ts)
├── pages/           # 주요 페이지 컴포넌트
│   ├── auth/        # OAuth 콜백/리다이렉트
│   ├── character/   # 캐릭터 생성(create) / 수정(edit)
│   ├── design/       # 디자인 시스템 Foundation Guide
│   ├── library/     # 캐릭터 라이브러리
│   ├── log-rooms/   # 로그방 목록/생성/상세/게시물 피드
│   └── profile/     # 마이페이지
├── store/           # Zustand 전역 상태 저장소
└── App.tsx          # 애플리케이션 루트 및 라우팅 설정
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Variables
루트에 `.env` 파일이 없으면 API 요청은 기본값인 프로덕션 서버(`https://get-bluepill.xyz`)로 전송됩니다.
로컬에서 띄운 서버로 테스트하려면 `client/.env`를 생성하세요 (`.gitignore`에 등록되어 커밋되지 않습니다):

```bash
VITE_API_BASE_URL=http://localhost:8080/api
# 로컬 OAuth 앱을 별도로 구성한 경우에만 필요
# VITE_OAUTH2_BASE_URL=http://localhost:8080
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🎨 Design Foundation
`/design-system` 경로에서 프로젝트에 설정된 모든 디자인 토큰(컬러, 타이포그래피)과 공통 컴포넌트의 가이드를 시각적으로 확인할 수 있는 **Foundation Guide**를 제공합니다.
