# 휴그린 제조 AI 웹 UI 디자인

## 목적과 범위

안전관리자가 이벤트를 조회하고, 현장 증거를 확인하고, 조치 결과를 기록하는 React 작업 화면. 웹 001–022만 포함하며 WPF 023–024는 제외한다. API 없이 현재 세션의 샘플 상태를 사용한다. 외부 배포하지 않는다.

## 디자인 계획 (frontend-design)

- 바탕: 작업 배경 #F5F7FA, 문서 표면 #FFFFFF, 본문 #23374A, 보조 본문 #617184, 조치 강조 #087F70, 위험 #B43E36.
- 서체: 한글은 Noto Sans KR Regular/Bold를 프로젝트 안에 저장해 사용한다. 제목 28px/700, 본문과 입력 14px/400–500, 목록 제목 16px/700, 부가 정보 12px. 숫자는 tabular-nums로 정렬한다.
- 간격: 4px 단위, 주요 영역 24px, 입력 간격 12px, 기본 조작 높이 40px.
- 배치: 모든 정보는 왼쪽 정렬. 고정 폭 메뉴와 가변 폭 작업 공간. 조회→목록→상세 순서를 유지하며 선택된 행의 녹색 가장자리와 상세 헤더를 연결한다.

```text
메뉴 검색 │ 열린 화면 탭
안전관리  │ 화면명                         신규 등록
CCTV관리  │ 기간 · 공장 · 설비 · 유형       조회
시스템관리│ 상태 필터 / 정렬 가능한 이벤트 목록
          │ 현장 스냅샷      조치 상태 · 담당자 · 내용
          │                              변경 저장
```

## 계획 검토와 수정

일반 SaaS처럼 보이는 영문 대문자 라벨을 한국어 업무 용어로 변경한다. 별도 대시보드 요약 카드나 장식 그래프를 추가하지 않는다. 특별한 시각 요소는 이벤트 증거 이미지 한 곳에 집중한다. 모듈 식별은 아이콘과 실제 메뉴 이름으로, 위험은 색상과 텍스트로 함께 전달한다. 표는 수평 스크롤을 허용하되 전체 페이지가 가로로 넘치지 않게 한다.

## 조사한 가이드

- Fluent 2 layout: https://fluent2.microsoft.design/layout — 4px 간격 체계, 정보 관계에 따른 간격과 정렬.
- Fluent 2 typography: https://fluent2.microsoft.design/typography/ — 기능별 서체 위계와 일관된 크기 체계.
- Carbon data table: https://v10.carbondesignsystem.com/components/data-table/usage/ — 표 도구 모음, 행 선택, 정렬, 하단 페이지 이동.
- WCAG 2.2 target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum — 조작 영역과 간격. 주요 버튼 40px, 탭 닫기 28px, 페이지 이동 30px.

2026년에 확인한 가이드를 적용했으며, 별도의 '2026 디자인 표준'이 있다고 주장하지 않는다. 접근성 전체 적합성 인증은 수행하지 않았다.

## 이미지 생성

내장 imagegen 사용. 파일: `public/factory-event-demo.png`. UI에는 AI 생성 샘플이며 실제 촬영이 아님을 명시한다.

프롬프트:

Use case: photorealistic-natural. Asset type: simulated CCTV event evidence photograph for a Korean manufacturing safety management web prototype. Wide 16:9 photograph viewed from an elevated fixed security camera, realistic tidy metal fabrication workshop with a large industrial hydraulic press on the right, yellow safety boundary markings on gray concrete floor, one adult worker wearing hard hat and navy workwear standing by the boundary on the left. Neutral daylight, muted steel gray and industrial green, high legibility, natural surveillance perspective, no cinematic drama. No injury, no text, no timestamp, no UI, no logos, no watermark. This is explicitly fictional demo evidence, not an actual factory photograph.

## 검증

`scripts/ui-review.cjs`로 22개 메뉴, 상태 조회, 저장, 등록, 페이지 이동, CSV 내보내기, 스냅샷 모달, 빈 결과, 모바일 메뉴 및 가로 넘침을 확인한다. 화면 이미지는 `output/ui-review/`에 저장하고 직접 시각 검토한다.

2026-10-08 검증 완료: 22개 화면 이동, 필터·정렬 UI, 상태 저장, 수동 등록, 페이지 이동, CSV 다운로드, 모달 Escape, 빈 결과 초기화, 모바일 메뉴 검색, 키보드 포커스 확인. 브라우저 런타임 오류 0건. 1536px 데스크톱, 390px 모바일, 768px 태블릿 캡처를 직접 검토했고 모바일·태블릿에서 페이지 전체 가로 넘침이 없음을 확인했다. 표와 열린 탭은 자체 가로 스크롤을 사용한다. 최종 Vite 빌드 성공.

공장·이벤트·사용자는 목업 데이터이며 인증, 실제 영상, 서버 저장은 연결하지 않았다. 이미지와 서체는 public 폴더에서 로컬로 제공한다. 생성 이미지 프롬프트와 출처 가이드는 위에 기록했다.
