# Hugreen

React와 Vite로 구성한 스마트 안전관리 화면입니다.

## 실행

```bash
npm install
npm run dev
```

품질 확인은 아래 명령으로 실행합니다.

```bash
npm run lint
npm run build
```

## 폴더 구조

```text
src/
├── app/
│   └── AppShell.jsx           # 화면 전환과 열린 탭 조립
├── components/
│   ├── layout/                # 사이드바·헤더 공통 레이아웃
│   ├── filters/               # 공통 조회 조건
│   ├── data-table/            # 공통 테이블·페이지네이션
│   └── ui/                    # 버튼·아이콘 등 공통 UI
├── data/
│   └── demoRows.js            # 화면 개발용 샘플 데이터
├── api/                        # HTTP 요청과 엔드포인트
├── services/                   # 응답 검증과 화면 데이터 가공
├── hooks/                      # API 로딩·오류 상태와 요청 취소
├── features/
│   └── auth/                   # 로그인 화면
├── pages/
│   ├── system-management/     # 시스템 관리 화면
│   ├── smart-safety-management/ # 스마트 안전관리 화면
│   └── ai-cctv-management/    # AI CCTV 관리 화면
├── styles/
│   ├── application.css        # 애플리케이션 공통 레이아웃 스타일
│   └── global.css             # 전역 토큰과 기본 요소 스타일
├── App.jsx                    # 기능 조립
└── main.jsx                   # 애플리케이션 진입점
```

공통 표현 요소는 `components/`에 둡니다. 서버 통신은 `api/`, 응답 가공과 비즈니스 규칙은 `services/`, React 상태 연결은 `hooks/`가 담당합니다. 실제 메뉴 화면 정의와 화면별 동작은 `pages/<domain>/*.page.js` 단위로 관리하며, 새 화면은 해당 업무 영역의 `index.js`에서 등록합니다.
