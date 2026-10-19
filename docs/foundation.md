# Hugreen Foundation

Hugreen Foundation은 산업 안전관리 화면에서 사용자가 위험 상태와 작업 결과를 빠르게 구분하도록 만드는 공통 규칙이다. 장식보다 판독성, 상태의 명확성, 반복 업무의 일관성을 우선한다.

참고: [디자인 시스템의 뼈대를 잡는 Foundation](https://brunch.co.kr/@655dad7f76004da/4)

## 원칙

1. 상태는 색상만으로 전달하지 않고 텍스트, 아이콘, 배지를 함께 사용한다.
2. 주요 작업은 Hugreen Green, 위험은 Safety Red, 주의는 Caution Amber로 구분한다.
3. 그림자는 장식이 아니라 고정 헤더, 패널, 팝업의 높이 차이를 표현할 때만 사용한다.
4. 모든 간격은 4px 단위를 기본으로 하며, 데이터 밀도가 높은 표에서는 2px 단위 보정을 허용한다.
5. 애니메이션은 사용자의 입력에 대한 확인 용도로만 사용한다.

## Color

### Primitive palette

| 계열 | 대표 토큰 | 용도 |
|---|---|---|
| Hugreen Green | `green-50`–`green-700` | 주요 작업, 선택, 정상 상태 |
| Neutral Steel | `neutral-50`–`neutral-900` | 배경, 텍스트, 선, 비활성 상태 |
| Safety Red | `red-50`, `red-500`, `red-600` | 위험, 삭제, 실패 |
| Caution Amber | `amber-50`, `amber-600` | 주의, 확인 필요 |
| Operational Blue | `blue-50`, `blue-600` | 정보, 시스템 안내 |

제품 코드에서는 색상 단계보다 `--surface-*`, `--text-*`, `--border-*` 시멘틱 토큰을 우선 사용한다. 브랜드 녹색을 위험이나 경고 의미로 사용하지 않는다.

## Typography

국문과 영문 모두 Pretendard Variable을 사용한다. 숫자가 반복되는 표에서는 `font-variant-numeric: tabular-nums`를 적용한다.

| 스타일 | 크기 / 행간 | 기본 굵기 | 용도 |
|---|---:|---:|---|
| Title Large | 26 / 35px | 650 | 화면 제목 |
| Title | 20 / 29px | 700 | 패널·섹션 제목 |
| Body | 15 / 22.5px | 400 | 설명과 본문 |
| Label | 13 / 19.5px | 550–650 | 버튼, 필드, 표 |
| Caption | 11 / 16.5px | 400–550 | 보조 정보, 시간, 메타데이터 |

## Shadows

| 토큰 | 사용 대상 |
|---|---|
| `--shadow-xs` | 작은 플로팅 컨트롤 |
| `--shadow-sm` | 데이터 패널 |
| `--shadow-md` | 드롭다운, 임시 레이어 |
| `--shadow-overlay` | 모달 다이얼로그 |

동일 계층의 카드마다 그림자를 반복하지 않는다. 표와 필터 구분에는 그림자보다 `--border-default`를 우선한다.

## Grid & Spacing

- 기준 단위: 4px
- 기본 콘텐츠 거터: 24px
- 데스크톱 그리드: 12열
- 상단 바: 56px
- 사이드바: 270px
- 기본 컨트롤 반경: 8px
- 패널 반경: 16px

화면은 좌측 정렬을 기본으로 한다. 숫자 열은 우측 정렬할 수 있으며, 상태와 짧은 작업 열만 중앙 정렬한다.

## Icons

- 기본 그리드: 24 × 24px
- 사용 크기: 16px, 20px, 24px
- 기본 선 굵기: 1.7px
- 선 끝과 모서리: round
- 아이콘 단독 버튼에는 반드시 접근 가능한 이름을 제공한다.
- 위험·주의·정상 상태는 색상과 함께 서로 다른 형태 또는 텍스트를 사용한다.

## Motion

- 빠른 눌림 피드백: 120ms
- 선택·체크 확인: 180ms
- 패널·탭 이동: 240ms
- 자동 재생 장식 모션은 사용하지 않는다.
- `prefers-reduced-motion`에서는 애니메이션과 전환을 제거한다.

토큰의 실제 값은 `src/styles/foundation.css`를 단일 기준으로 사용한다.
