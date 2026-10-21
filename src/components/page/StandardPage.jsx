import { useLayoutEffect, useRef, useState } from "react";
import DataTable from "../organisms/DataTable/DataTable";
import Pagination from "../molecules/Pagination/Pagination";
import SearchConditions from "../organisms/SearchConditions/SearchConditions";
import Badge from "../atoms/Badge/Badge";
import Button from "../atoms/Button/Button";
import {
  CameraIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../atoms/Icon/Icon";
import Checkbox from "../atoms/Checkbox/Checkbox";
import DropDownMenu from "../atoms/Menu/DropDownMenu";
import StateEmoji from "../atoms/StateEmoji/StateEmoji";
import Toast from "../molecules/Toast/Toast";
import useNativeDialog from "../../hooks/useNativeDialog";

const statuses = ["미확인", "확인", "조치중", "조치완료", "오탐 종결"];
const PAGE_SIZE = 15;
const factoryEventDemoUrl = `${import.meta.env.BASE_URL}factory-event-demo.png`;
const rowSelectionHiddenScreens = [
  "MES-TD3-001",
  "MES-TD3-005",
  "MES-TD3-006",
  "MES-TD3-007",
  "MES-TD3-008",
  "MES-TD3-009",
  "MES-TD3-013",
  "MES-TD3-014",
  "MES-TD3-017",
];
function StatusBadge({ value }) {
  const tone = ["위험", "미확인", "장애", "취소", "부분취소"].includes(value)
    ? "red"
    : ["주의", "조치중", "승인 대기", "실패", "결제실패", "취소실패"].includes(value)
      ? "amber"
      : ["조치완료", "정상", "승인", "적합"].includes(value)
        ? "green"
        : "neutral";
  return <Badge size="small" variant="weak" tone={tone === "neutral" ? "gray" : tone}>{value}</Badge>;
}
function raw(col, r, i) {
  if (
    r[col] !== undefined &&
    !["처리 상태", "확인 상태", "담당자"].includes(col)
  )
    return r[col];
  const map = {
    이벤트ID: r.id,
    "외부 이벤트ID": r.id,
    공장: r.plant,
    설비: r.equipment,
    "설치 설비": r.equipment,
    장비: r.equipment,
    장비명: r.equipment,
    위치: r.location,
    "설치 위치": r.location,
    구역: r.location,
    "이벤트 유형": r.type,
    "위험 단계": r.level,
    "처리 상태": r.status,
    "확인 상태": r.status,
    담당자: r.owner || "안전관리팀",
    카메라: `CAM-${String(i + 1).padStart(2, "0")}`,
    카메라ID: `CAM-${String(i + 1).padStart(2, "0")}`,
    카메라명: `${r.equipment} 상부`,
    센서ID: `SEN-00${i + 1}`,
    센서명: `${r.equipment} 감지 센서`,
    "센서 유형": i % 2 ? "환경센서" : "라이트커튼",
    센서: `SEN-00${i + 1}`,
    발생원: i % 2 ? "센서" : "AI CCTV",
    "스냅샷 수": 3,
    영상: "스냅샷 3장",
    "모델 버전": "v2.4.1",
    "반영 모델 버전": "v2.4.1",
    IP: `192.168.10.${101 + i}`,
    "통신 방식": i % 2 ? "HTTP" : "PLC",
    "연결 PLC": `PLC-${String(i + 1).padStart(2, "0")}`,
    "PLC 입력주소": `D${100 + i}`,
    "장비 식별값": `EQP-${String(i + 1).padStart(3, "0")}`,
    기준값: i % 2 ? "35.0" : "1",
    "감지 이벤트 유형": r.type,
    "수신 유예시간": "30초",
    "연계 대상": ["MES", "NVR", "VMS"][i % 3],
    "로그 유형": i % 2 ? "수신" : "송신",
    "데이터 유형": "이벤트 메타데이터",
    문서명: "설비 일상 안전점검",
    "점검 문서": "설비 일상 안전점검",
    "점검 항목": "비상 정지 장치 작동",
    "입력 방식": "적합·부적합",
    "정렬 순서": i + 1,
    "목차 코드": `CHK-${i + 1}`,
    점검자: "김민수",
    승인자: "이현균",
    "승인 상태": r.approval || "승인 대기",
    "사용 여부": "사용",
    "집중감시구역 여부": i < 3 ? "집중감시" : "일반구역",
    위험구역: r.location,
    "등록 구분": r.manual ? "수동" : "자동",
    "설비·구역": r.equipment,
    "카메라·설비": r.equipment,
    "설비(카메라)": r.equipment,
    "조치 상태": r.status,
    상태: r.status,
    "보관 상태": "보관 중",
    "후보 상태": "검토 대기",
    "등록 사유": "감지 정확도 개선",
    "경보 방식": "현장 음성 방송",
    "발송 주체": "AI CCTV 시스템",
    "장애 유형": "통신 끊김",
    "장애 내용": "장비 통신 연결이 중단되었습니다.",
    확인자: "안전관리팀",
    원인: "네트워크 연결 불안정",
    "원인 구분": "내부 원인",
    "조치 내용": "통신 상태 확인 및 연결 복구",
    "오류 내용": "—",
    감지구역: "위험구역",
    "경보 유형": "위험 접근 경고",
    "처리 전": "미확인",
    "처리 후": r.status,
    "점검 등록 여부": "미등록",
    "이벤트 건수": i + 3,
    "위험 건수": i + 1,
    미조치: i % 3,
  };
  if (col in map) return map[col];
  if (/시각|일시/.test(col)) return r.time;
  if (/등록일|점검일자/.test(col)) return r.time.slice(0, 10);
  if (/번호|ID/.test(col)) return `HG-261008-${String(i + 1).padStart(3, "0")}`;
  if (/처리자|확인자/.test(col)) return "안전관리팀";
  if (/결과|상태|수신/.test(col)) return "정상";
  return "—";
}
function formatDateTime(value) {
  if (!value || value === "—") return value;
  return String(value).replace("T", " ").slice(0, 19);
}
function options(field, rows) {
  if (field === "처리 상태" || field === "확인 상태") return statuses;
  if (field === "승인 상태") return ["승인 대기", "승인", "반려"];
  if (field === "사용 여부") return ["사용", "미사용"];
  if (field === "장비 구분") return ["AI CCTV", "센서"];
  if (field === "문서 구분") return ["일상 점검", "정기 점검"];
  if (field === "집중감시구역 여부") return ["집중감시", "일반구역"];
  if (field === "등록 구분") return ["자동", "수동"];
  if (field === "조치 상태" || field === "상태") return statuses;
  return [
    ...new Set(
      rows.map((r, i) =>
        String(raw(field === "카메라(구역)" ? "구역" : field, r, i)),
      ),
    ),
  ];
}
const detailSections = {
  training: [
    { title: "학습 후보", fields: ["이벤트ID", "카메라", "이벤트 유형", "등록 사유", "후보 상태", "반영 모델 버전"] },
    { title: "데이터셋·모델 버전", fields: ["모델명", "버전", "적용 대상", "데이터 건수", "수집 기간", "적용일자", "사용 상태"] },
  ],
  sensor: [
    { title: "센서 기본 정보", fields: ["센서ID", "센서명", "센서 유형", "공장", "설치 설비", "통신 방식"] },
    { title: "연계 설정", fields: ["연결 PLC", "PLC 입력주소", "장비 식별값", "기준값", "감지 이벤트 유형", "수신 유예시간", "사용 여부"] },
  ],
  inspection: [{ title: "점검 결과 및 승인", fields: ["항목별 결과", "사진", "승인자", "승인일시", "반려 사유"] }],
  history: [{ title: "보관된 점검 결과", fields: ["항목별 결과", "조치 내용", "승인 결과"] }],
  event: [{ title: "처리 정보", fields: ["확인 상태", "담당자", "조치 상태", "조치 내용", "완료일시", "근거자료"] }],
  camera: [
    {
      title: "기본 정보",
      fields: [
        "카메라ID",
        "카메라명",
        "공장",
        "설치 위치",
        "대상 설비",
        "모델",
        "IP 주소",
        "수신 유예시간(초)",
        "사용 여부",
      ],
    },
  ],
  receive: [{ title: "수신 확인", fields: ["확인 상태", "비고"] }],
  alarm: [{ title: "경보 해제 정보", fields: ["해제 일시", "해제 사유", "비고"] }],
  link: [{ title: "안전점검일지 연계", fields: ["점검 문서", "발생일시", "설비", "위치", "이벤트 유형", "추가 점검 결과", "조치 사항"] }],
  failure: [{
    title: "장애 상세 정보",
    fields: ["장애 내용", "확인자", "원인", "원인 구분", "조치 내용", "담당자", "복구일시"],
  }],
  form: [{ title: "상세 정보", fields: ["확인 상태", "비고"] }],
};
const treeDetailFields = {
  문서: ["문서코드", "문서명", "대상 설비", "점검 주기", "사용 여부"],
  목차: ["목차번호", "목차명", "순서"],
  항목: ["항목번호", "항목명", "점검 기준", "입력 방식", "순서", "사용 여부"],
};
const treeDetailDefaults = {
  문서: {
    문서코드: "DOC-001",
    문서명: "설비 일상 안전점검",
    "대상 설비": "프레스 6000",
    "점검 주기": "매일",
    "사용 여부": "사용",
  },
  목차: { 목차번호: "CHK-01", 목차명: "작업 전 점검", 순서: "1" },
  항목: {
    항목번호: "ITM-001",
    항목명: "비상 정지 장치 작동 상태",
    "점검 기준": "비상 정지 버튼 작동 시 설비가 즉시 정지해야 함",
    "입력 방식": "적합·부적합",
    순서: "1",
    "사용 여부": "사용",
  },
};
function detailChoices(field) {
  if (["확인 상태", "조치 상태", "처리 상태"].includes(field)) return statuses;
  if (field === "후보 상태") return ["검토 대기", "선정", "제외", "반영 완료"];
  if (["사용 상태", "사용 여부"].includes(field)) return ["사용", "미사용"];
  if (field === "승인 결과") return ["승인", "반려"];
  if (field === "원인 구분") return ["내부 원인", "공급 범위 밖"];
  if (field === "위험 단계") return ["주의", "위험"];
  if (field === "구역 유형") return ["위험구역", "가상선"];
  if (field === "집중감시구역 여부") return ["집중감시", "일반구역"];
  return null;
}

const treeTypeMeta = {
  document: { label: "문서", fields: treeDetailFields.문서 },
  chapter: { label: "목차", fields: treeDetailFields.목차 },
  item: { label: "항목", fields: treeDetailFields.항목 },
};
const treeTypeOrder = ["document", "chapter", "item"];
const initialTreeNodes = [
  {
    id: "doc-1", parentId: null, type: "document", order: 1,
    name: "설비 일상 안전점검",
    values: { ...treeDetailDefaults.문서 },
  },
  {
    id: "chapter-1", parentId: "doc-1", type: "chapter", order: 1,
    name: "작업 전 점검",
    values: { ...treeDetailDefaults.목차 },
  },
  {
    id: "item-1", parentId: "chapter-1", type: "item", order: 1,
    name: "비상 정지 장치 작동 상태",
    values: { ...treeDetailDefaults.항목 },
  },
  {
    id: "item-2", parentId: "chapter-1", type: "item", order: 2,
    name: "안전 가드 설치 상태",
    values: { 항목번호: "ITM-002", 항목명: "안전 가드 설치 상태", "점검 기준": "안전 가드가 지정 위치에 견고하게 설치되어야 함", "입력 방식": "적합·부적합", 순서: "2", "사용 여부": "사용" },
  },
  {
    id: "chapter-2", parentId: "doc-1", type: "chapter", order: 2,
    name: "가동 중 점검",
    values: { 목차번호: "CHK-02", 목차명: "가동 중 점검", 순서: "2" },
  },
  {
    id: "item-3", parentId: "chapter-2", type: "item", order: 1,
    name: "이상 소음 및 진동",
    values: { 항목번호: "ITM-003", 항목명: "이상 소음 및 진동", "점검 기준": "가동 중 비정상 소음이나 진동이 없어야 함", "입력 방식": "적합·부적합", 순서: "1", "사용 여부": "사용" },
  },
  {
    id: "chapter-3", parentId: "doc-1", type: "chapter", order: 3,
    name: "작업 후 점검",
    values: { 목차번호: "CHK-03", 목차명: "작업 후 점검", 순서: "3" },
  },
  {
    id: "item-4", parentId: "chapter-3", type: "item", order: 1,
    name: "전원 차단 상태",
    values: { 항목번호: "ITM-004", 항목명: "전원 차단 상태", "점검 기준": "작업 종료 후 주 전원이 차단되어야 함", "입력 방식": "적합·부적합", 순서: "1", "사용 여부": "사용" },
  },
];

function highlightedText(text, query) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>;
}

function TreeView({ nodes, selectedId, expanded, query, onQueryChange, onToggle, onSelect, onAddDocument }) {
  const treeRef = useRef(null);
  const childrenOf = (parentId) => nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order);
  const matches = (node) => node.name.toLowerCase().includes(query.trim().toLowerCase());
  const branchMatches = (node) => matches(node) || childrenOf(node.id).some(branchMatches);
  const searchOpen = new Set();
  if (query.trim()) {
    nodes.forEach((node) => {
      if (!matches(node)) return;
      let parent = nodes.find((candidate) => candidate.id === node.parentId);
      while (parent) {
        searchOpen.add(parent.id);
        parent = nodes.find((candidate) => candidate.id === parent.parentId);
      }
    });
  }
  const isOpen = (id) => query.trim() ? searchOpen.has(id) : expanded.has(id);
  const visibleNodes = [];
  const collect = (parentId, depth) => {
    childrenOf(parentId).forEach((node) => {
      if (query.trim() && !branchMatches(node)) return;
      visibleNodes.push({ node, depth });
      if (isOpen(node.id)) collect(node.id, depth + 1);
    });
  };
  collect(null, 0);
  const moveFocus = (id) => requestAnimationFrame(() => treeRef.current?.querySelector(`[data-node-id="${id}"]`)?.focus());
  const handleKeyDown = (event, node) => {
    const index = visibleNodes.findIndex((entry) => entry.node.id === node.id);
    const children = childrenOf(node.id);
    if (event.key === "ArrowDown" && visibleNodes[index + 1]) moveFocus(visibleNodes[index + 1].node.id);
    else if (event.key === "ArrowUp" && visibleNodes[index - 1]) moveFocus(visibleNodes[index - 1].node.id);
    else if (event.key === "ArrowRight") {
      if (children.length && !isOpen(node.id)) onToggle(node.id);
      else if (children[0]) moveFocus(children[0].id);
    } else if (event.key === "ArrowLeft") {
      if (children.length && isOpen(node.id)) onToggle(node.id);
      else if (node.parentId) moveFocus(node.parentId);
    } else if (event.key === "Enter" || event.key === " ") onSelect(node.id);
    else return;
    event.preventDefault();
  };
  return (
    <aside className="tree-pane">
      <div className="pane-heading">
        <h2>점검 문서</h2>
        <button className="primary" onClick={onAddDocument}><PlusIcon size={14} aria-hidden="true" /> 문서 추가</button>
      </div>
      <div className="tree-search-wrap">
        <label className="tree-search">
          <SearchIcon size={15} aria-hidden="true" />
          <input type="search" aria-label="점검 문서 검색" placeholder="문서 검색" value={query} onChange={(event) => onQueryChange(event.target.value)} />
        </label>
      </div>
      <nav ref={treeRef} className="main-tree" role="tree" aria-label="점검 문서 목차">
        {visibleNodes.map(({ node, depth }) => {
          const children = childrenOf(node.id);
          const prefix = node.type === "chapter" ? `${node.order}.` : node.type === "item" ? `${nodes.find((item) => item.id === node.parentId)?.order || 1}.${node.order}` : "";
          return (
            <div
              key={node.id}
              role="treeitem"
              aria-level={depth + 1}
              aria-selected={selectedId === node.id}
              aria-expanded={children.length ? isOpen(node.id) : undefined}
              tabIndex={selectedId === node.id ? 0 : -1}
              data-node-id={node.id}
              className={`tree-node ${selectedId === node.id ? "selected" : ""} type-${node.type}`}
              style={{ "--tree-depth": depth }}
              onClick={() => onSelect(node.id)}
              onKeyDown={(event) => handleKeyDown(event, node)}
            >
              {children.length ? (
                <button className={`tree-toggle ${isOpen(node.id) ? "open" : ""}`} aria-label={isOpen(node.id) ? "접기" : "펼치기"} tabIndex={-1} onClick={(event) => { event.stopPropagation(); onToggle(node.id); }}>
                  <ChevronIcon size={16} aria-hidden="true" />
                </button>
              ) : <span className="tree-toggle-spacer" />}
              <span className="tree-node-label">{prefix && <span className="tree-number">{prefix}</span>}{highlightedText(node.name, query.trim())}</span>
            </div>
          );
        })}
        {!visibleNodes.length && <span className="tree-search-empty">검색 결과가 없습니다.</span>}
      </nav>
    </aside>
  );
}

function DetailPanel({ nodes, selectedId, activeTab, mode, draft, onTab, onEdit, onCancel, onSave, onDraft, onAdd, onDelete, onSelect, onMove }) {
  const selectedNode = nodes.find((node) => node.id === selectedId);
  if (!selectedNode) return <section className="tree-detail-pane tree-empty"><StateEmoji code="u1F4C4" /><p>왼쪽에서 문서를 선택하거나 문서를 추가해 주세요</p></section>;
  const ancestors = [];
  let cursor = selectedNode;
  while (cursor) { ancestors.unshift(cursor); cursor = nodes.find((node) => node.id === cursor.parentId); }
  const selectedLevel = treeTypeOrder.indexOf(selectedNode.type);
  const displayedNode = ancestors.find((node) => node.type === activeTab) || selectedNode;
  const meta = treeTypeMeta[displayedNode.type];
  const fields = meta.fields.filter((field) => field !== "사용 여부");
  const children = nodes.filter((node) => node.parentId === displayedNode.id).sort((a, b) => a.order - b.order);
  const childLabel = displayedNode.type === "document" ? "소속 목차" : displayedNode.type === "chapter" ? "소속 항목" : "";
  const valueOf = (field) => draft[field] !== undefined ? draft[field] : displayedNode.values[field] || "";
  return (
    <section className="tree-detail-pane">
      <header className="tree-detail-head">
        <div className="tree-path" aria-label="선택 경로">{ancestors.map((node, index) => <span key={node.id}>{index > 0 && <b>›</b>}{node.type === "chapter" ? `${node.order}. ` : node.type === "item" ? `${ancestors.find((item) => item.type === "chapter")?.order || 1}.${node.order} ` : ""}{node.name}</span>)}</div>
        <div className="tree-detail-actions">
          <button className="secondary" disabled={!['document','chapter'].includes(selectedNode.type) || mode !== 'view'} onClick={() => onAdd('chapter')}>목차 추가</button>
          <button className="secondary" disabled={selectedNode.type !== 'chapter' || mode !== 'view'} onClick={() => onAdd('item')}>항목 추가</button>
          <button className="danger-button" disabled={mode !== 'view'} onClick={onDelete}><TrashIcon size={14} aria-hidden="true" /> 삭제</button>
          <button className="primary" disabled={mode !== 'view'} onClick={onEdit}>수정</button>
        </div>
      </header>
      <div className="tree-detail-tabs" role="tablist" aria-label="상세 정보 유형">
        {treeTypeOrder.map((type) => (
          <button key={type} type="button" role="tab" disabled={mode !== "view" || treeTypeOrder.indexOf(type) > selectedLevel} aria-selected={activeTab === type} className={activeTab === type ? "active" : ""} onClick={() => onTab(type)}>{treeTypeMeta[type].label}</button>
        ))}
      </div>
      <div className="tree-detail-content">
        <div className="tree-section-title">
          <h3>{meta.label} 상세</h3>
          {displayedNode.values["사용 여부"] && (mode === "view" ? <span className={`usage-chip ${displayedNode.values["사용 여부"] === "사용" ? "on" : "off"}`}>{displayedNode.values["사용 여부"]}</span> : <DropDownMenu className="usage-select" value={valueOf("사용 여부")} onChange={(event) => onDraft("사용 여부", event.target.value)}><option>사용</option><option>미사용</option></DropDownMenu>)}
        </div>
        <div className="tree-record-grid">
          {fields.map((field) => {
            const locked = ["문서코드", "목차번호", "항목번호"].includes(field) && mode === "edit";
            const wide = field === "점검 기준" || (fields.length % 2 === 1 && field === fields.at(-1));
            return (
              <label key={field} className={wide ? "wide" : ""}>
                <span>{field}</span>
                {mode === "view" || locked ? <span className={`tree-record-value${locked ? " is-locked" : ""}`}>{valueOf(field) || "-"}</span> : field === "입력 방식" ? (
                  <DropDownMenu value={valueOf(field)} onChange={(event) => onDraft(field, event.target.value)}><option value="">선택</option><option>적합·부적합</option><option>수치</option><option>텍스트</option></DropDownMenu>
                ) : field === "점검 기준" ? <textarea value={valueOf(field)} onChange={(event) => onDraft(field, event.target.value)} /> : <input type={field === "순서" ? "number" : "text"} value={valueOf(field)} onChange={(event) => onDraft(field, event.target.value)} />}
              </label>
            );
          })}
        </div>
        {childLabel && (
          <section className="tree-child-section">
            <h3>{childLabel} <span>{children.length}</span></h3>
            {children.length ? <div className="tree-child-table"><table><thead><tr><th>번호</th><th>이름</th><th>사용 여부</th><th>순서</th></tr></thead><tbody>{children.map((child, index) => <tr key={child.id} onClick={() => onSelect(child.id)}><td>{displayedNode.type === "document" ? `${index + 1}.` : `${displayedNode.order}.${index + 1}`}</td><td>{child.name}</td><td>{child.values["사용 여부"] || "-"}</td><td><div className="order-actions"><span>{index + 1}</span><button aria-label="위로 이동" disabled={index === 0} onClick={(event) => { event.stopPropagation(); onMove(child.id, -1); }}>↑</button><button aria-label="아래로 이동" disabled={index === children.length - 1} onClick={(event) => { event.stopPropagation(); onMove(child.id, 1); }}>↓</button></div></td></tr>)}</tbody></table></div> : <p className="tree-child-empty">등록된 {displayedNode.type === "document" ? "목차" : "항목"}이 없습니다.</p>}
          </section>
        )}
      </div>
      {mode !== "view" && <footer className="tree-save-bar"><span>변경 내용은 현재 화면에만 저장됩니다.</span><div><button className="secondary" onClick={onCancel}>변경 취소</button><button className="primary" onClick={onSave}><CheckIcon size={14} aria-hidden="true" /> 저장</button></div></footer>}
    </section>
  );
}

export default function StandardPage({ pageDefinition, initialRows }) {
  const current = pageDefinition.id;
  const [records, setRecords] = useState({}),
    [selected, setSelected] = useState(null),
    [selectedRows, setSelectedRows] = useState([]),
    [draft, setDraft] = useState({}),
    [query, setQuery] = useState({}),
    [applied, setApplied] = useState({}),
    [status, setStatus] = useState("전체"),
    [sort, setSort] = useState(false),
    [page, setPage] = useState(1),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(null),
    [detailOpen, setDetailOpen] = useState(false),
    [sensorMode, setSensorMode] = useState("view"),
    [detailSectionTab, setDetailSectionTab] = useState("학습 후보"),
    [newType, setNewType] = useState("위험구역 접근"),
    [newEquipment, setNewEquipment] = useState("프레스 6000"),
    [treeNodes, setTreeNodes] = useState(initialTreeNodes),
    [treeSelected, setTreeSelected] = useState("chapter-1"),
    [treeExpanded, setTreeExpanded] = useState(new Set(["doc-1", "chapter-1"])),
    [treeTab, setTreeTab] = useState("chapter"),
    [treeQuery, setTreeQuery] = useState(""),
    [treeMode, setTreeMode] = useState("view"),
    [treeDraft, setTreeDraft] = useState({});
  const dialog = useRef(null),
    detailDialog = useRef(null),
    detailTabsElement = useRef(null),
    detailTabIndicator = useRef(null);
  const name = pageDefinition.title,
    conf = pageDefinition.config,
    suffix = current.slice(-3),
    inlineDetail = Boolean(
      conf.detail && !["log", "snap", "tree"].includes(conf.detail),
    ),
    screenFormat = conf.layout === "tree"
      ? "tree"
      : conf.layout === "snapshot"
        ? "special"
        : inlineDetail
          ? "list-detail"
          : "list",
    canSave = Boolean(conf.actions?.save),
    canExport = Boolean(conf.actions?.export),
    canCreate = Boolean(conf.actions?.create),
    rows = records[current] || initialRows;
  const tabbedDetail = ["training", "camera"].includes(conf.detail);
  const showRowSelection = !rowSelectionHiddenScreens.includes(current);
  const detailTabs = tabbedDetail ? detailSections[conf.detail] : [];
  const activeDetailTab = detailTabs.some(
    (section) => section.title === detailSectionTab,
  )
    ? detailSectionTab
    : detailTabs[0]?.title;
  useLayoutEffect(() => {
    const tabList = detailTabsElement.current;
    const indicator = detailTabIndicator.current;
    if (!tabList || !indicator || !tabbedDetail) return undefined;

    const moveIndicator = () => {
      const activeTab = tabList.querySelector('[role="tab"][aria-selected="true"]');
      if (!activeTab) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.width = `${activeTab.offsetWidth}px`;
      indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      indicator.style.opacity = "1";
    };

    moveIndicator();
    const resizeObserver = new ResizeObserver(moveIndicator);
    resizeObserver.observe(tabList);
    return () => resizeObserver.disconnect();
  }, [activeDetailTab, tabbedDetail]);
  const notify = (message) => {
    setToast(message);
  };
  useNativeDialog(dialog, Boolean(modal));
  useNativeDialog(detailDialog, Boolean(detailOpen), { enabled: !inlineDetail });
  const applyQuery = (nextQuery) => {
    setQuery(nextQuery);
    const hasDateFilter = conf.filters.some(
      (field) => field === "기간" || field.includes("일자"),
    );
    setApplied(
      hasDateFilter
        ? {
            from: nextQuery.from || "2026-10-01",
            to: nextQuery.to || "2026-10-08",
            ...nextQuery,
          }
        : { ...nextQuery },
    );
    setPage(1);
    setDraft({});
    setSensorMode("view");
  };
  const filtered = rows.filter(
    (r, i) =>
      (status === "전체" || r.status === status) &&
      Object.entries(applied).every(
        ([key, value]) =>
          !value ||
          (Array.isArray(value)
            ? value.length === 0 || value.includes(String(raw(key, r, i)))
            : key === "from"
            ? r.time.slice(0, 10) >= value
            : key === "to"
              ? r.time.slice(0, 10) <= value
              : key === "keyword"
                ? [
                    ...Object.values(r),
                    ...conf.cols.map((col) => raw(col, r, i)),
                  ].some((item) =>
                    String(item).toLowerCase().includes(value.toLowerCase()),
                  )
              : String(raw(key === "카메라(구역)" ? "구역" : key, r, i)) ===
                value),
      ),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time),
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    row = filtered.find((r) => r.id === selected),
    dirty = Object.keys(draft).length > 0 || Object.keys(treeDraft).length > 0;
  const supportsDelete = Boolean(conf.actions?.delete);
  const deletableSelectedRows = selectedRows.filter((id) =>
    rows.some((item) => item.id === id),
  );
  const canDelete = supportsDelete && Boolean(row);
  const deleteTargetIds = deletableSelectedRows.length
    ? deletableSelectedRows
    : canDelete
      ? [row.id]
      : [];
  const selectRow = (id) => {
    if (
      dirty &&
      !window.confirm("저장하지 않은 변경 내용을 버리고 이동할까요?")
    )
      return;
    setSelected(id);
    if (showRowSelection) {
      setSelectedRows((ids) => ids.includes(id) ? ids : [...ids, id]);
    }
    setDetailSectionTab("학습 후보");
    setDraft({});
    setSensorMode("view");
  };
  const toggleRowSelection = (id) => {
    if (!selectedRows.includes(id)) {
      selectRow(id);
      return;
    }

    if (
      selected === id &&
      dirty &&
      !window.confirm("저장하지 않은 변경 내용을 버리고 선택을 해제할까요?")
    ) return;

    const nextSelectedRows = selectedRows.filter((selectedId) => selectedId !== id);
    setSelectedRows(nextSelectedRows);
    if (selected === id) {
      setSelected(nextSelectedRows.at(-1) || null);
      setDraft({});
      setSensorMode("view");
    }
  };
  const toggleAllRowSelection = (ids, checked) => {
    const visibleIds = new Set(ids);
    if (
      !checked &&
      selected &&
      visibleIds.has(selected) &&
      dirty &&
      !window.confirm("저장하지 않은 변경 내용을 버리고 전체 선택을 해제할까요?")
    ) return;

    const nextSelectedRows = checked
      ? [...new Set([...selectedRows, ...ids])]
      : selectedRows.filter((id) => !visibleIds.has(id));
    setSelectedRows(nextSelectedRows);
    if (!checked && selected && visibleIds.has(selected)) {
      setSelected(nextSelectedRows.at(-1) || null);
      setDraft({});
      setSensorMode("view");
    }
  };
  const update = (changes) => {
    setRecords({
      ...records,
      [current]: rows.map((r) => (r.id === row?.id ? { ...r, ...changes } : r)),
    });
    setDraft({});
    setSensorMode("view");
    notify("변경 내용을 화면에 저장했습니다.");
  };
  const exportCsv = () => {
    const text =
      "\uFEFF" +
      [conf.cols, ...sorted.map((r, i) => conf.cols.map((c) => raw(c, r, i)))]
        .map((line) =>
          line
            .map((x) => '"' + String(x).replaceAll('"', '""') + '"')
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("조회 결과를 CSV로 내보냈습니다.");
  };
  const downloadSnapshot = async () => {
    if (!row) return;

    try {
      const response = await fetch(factoryEventDemoUrl);
      if (!response.ok) throw new Error("snapshot download failed");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${row.id}-snapshot.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify("선택한 이벤트의 스냅샷을 내려받았습니다.");
    } catch {
      notify("스냅샷을 내려받지 못했습니다. 다시 시도해 주세요.");
    }
  };
  const fieldValue = (f) => {
    if (draft[f] !== undefined) return draft[f];
    if (["처리 상태", "확인 상태", "조치 상태"].includes(f)) return row.status;
    if (f === "담당자") return row.owner || "안전관리팀";
    const rowIndex = Math.max(
      0,
      rows.findIndex((item) => item.id === row.id),
    );
    const value = row[f] ?? raw(f, row, rowIndex);
    return value === "—" ? detailChoices(f)?.[0] || "" : value;
  };
  const selectTreeNode = (id) => {
    if (Object.keys(treeDraft).length && !window.confirm("저장하지 않은 변경사항이 있어요. 변경 내용을 버리고 이동할까요?")) return;
    const node = treeNodes.find((item) => item.id === id);
    if (!node) return;
    setTreeSelected(id);
    setTreeTab(node.type);
    setTreeMode("view");
    setTreeDraft({});
    setTreeExpanded((currentExpanded) => {
      const next = new Set(currentExpanded);
      let parent = treeNodes.find((item) => item.id === node.parentId);
      while (parent) { next.add(parent.id); parent = treeNodes.find((item) => item.id === parent.parentId); }
      return next;
    });
  };
  const toggleTreeNode = (id) => setTreeExpanded((currentExpanded) => {
    const next = new Set(currentExpanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const addTreeNode = (type) => {
    const selectedNode = treeNodes.find((node) => node.id === treeSelected);
    let parentId = null;
    if (type === "chapter") parentId = selectedNode?.type === "document" ? selectedNode.id : selectedNode?.parentId;
    if (type === "item") parentId = selectedNode?.type === "chapter" ? selectedNode.id : null;
    if (type !== "document" && !parentId) return;
    const siblings = treeNodes.filter((node) => node.parentId === parentId && node.type === type);
    const sequence = treeNodes.filter((node) => node.type === type).length + 1;
    const codeField = type === "document" ? "문서코드" : type === "chapter" ? "목차번호" : "항목번호";
    const nameField = type === "document" ? "문서명" : type === "chapter" ? "목차명" : "항목명";
    const codePrefix = type === "document" ? "DOC" : type === "chapter" ? "CHK" : "ITM";
    const id = `${type}-${Date.now()}`;
    const values = Object.fromEntries(treeTypeMeta[type].fields.map((field) => [field, ""]));
    values[codeField] = `${codePrefix}-${String(sequence).padStart(type === "document" ? 3 : 2, "0")}`;
    values[nameField] = `새 ${treeTypeMeta[type].label}`;
    values.순서 = String(siblings.length + 1);
    if ("사용 여부" in values) values["사용 여부"] = "사용";
    const node = { id, parentId, type, order: siblings.length + 1, name: values[nameField], values };
    setTreeNodes((currentNodes) => [...currentNodes, node]);
    if (parentId) setTreeExpanded((currentExpanded) => new Set([...currentExpanded, parentId]));
    setTreeSelected(id);
    setTreeTab(type);
    setTreeMode("create");
    setTreeDraft(values);
  };
  const saveTree = () => {
    const selectedNode = treeNodes.find((node) => node.id === treeSelected);
    if (!selectedNode) return;
    let targetNode = selectedNode;
    while (targetNode && targetNode.type !== treeTab) targetNode = treeNodes.find((node) => node.id === targetNode.parentId);
    if (!targetNode) return;
    const nameField = targetNode.type === "document" ? "문서명" : targetNode.type === "chapter" ? "목차명" : "항목명";
    setTreeNodes((currentNodes) => currentNodes.map((node) => node.id === targetNode.id ? { ...node, name: treeDraft[nameField] ?? node.name, values: { ...node.values, ...treeDraft } } : node));
    setTreeDraft({});
    setTreeMode("view");
    notify(treeMode === "create" ? `새 ${treeTypeMeta[selectedNode.type].label}을 추가했습니다.` : "변경 내용을 화면에 저장했습니다.");
  };
  const deleteTreeNode = () => {
    const selectedNode = treeNodes.find((node) => node.id === treeSelected);
    if (!selectedNode) return;
    const descendants = [];
    const collect = (id) => treeNodes.filter((node) => node.parentId === id).forEach((node) => { descendants.push(node); collect(node.id); });
    collect(selectedNode.id);
    const chapterCount = descendants.filter((node) => node.type === "chapter").length;
    const itemCount = descendants.filter((node) => node.type === "item").length;
    const message = descendants.length ? `하위 목차 ${chapterCount}개, 항목 ${itemCount}개도 함께 삭제돼요. 삭제할까요?` : `${selectedNode.name}을(를) 삭제할까요?`;
    if (!window.confirm(message)) return;
    const deletedIds = new Set([selectedNode.id, ...descendants.map((node) => node.id)]);
    setTreeNodes((currentNodes) => currentNodes.filter((node) => !deletedIds.has(node.id)));
    const fallback = treeNodes.find((node) => node.id === selectedNode.parentId) || treeNodes.find((node) => !deletedIds.has(node.id));
    setTreeSelected(fallback?.id || null);
    setTreeTab(fallback?.type || "document");
    notify("선택한 항목을 화면에서 삭제했습니다.");
  };
  const moveTreeNode = (id, direction) => {
    setTreeNodes((currentNodes) => {
      const target = currentNodes.find((node) => node.id === id);
      const siblings = currentNodes.filter((node) => node.parentId === target.parentId && node.type === target.type).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex((node) => node.id === id);
      const swap = siblings[index + direction];
      if (!swap) return currentNodes;
      return currentNodes.map((node) => node.id === target.id ? { ...node, order: swap.order, values: { ...node.values, 순서: String(swap.order) } } : node.id === swap.id ? { ...node, order: target.order, values: { ...node.values, 순서: String(target.order) } } : node);
    });
  };
  const sensorFields = detailSections.sensor.flatMap(
    (section) => section.fields,
  );
  const beginSensorCreate = () => {
    setDraft(Object.fromEntries(sensorFields.map((field) => [field, ""])));
    setSensorMode("create");
  };
  const saveSensor = () => {
    if (sensorMode === "create") {
      const sensorId = draft["센서ID"]?.trim();
      if (!sensorId) {
        notify("센서ID를 입력해주세요.");
        return;
      }
      const created = {
        ...initialRows[0],
        ...draft,
        id: sensorId,
        plant: draft["공장"],
        equipment: draft["설치 설비"],
        type: draft["감지 이벤트 유형"],
        status: "미확인",
        manual: true,
      };
      setRecords({ ...records, [current]: [created, ...rows] });
      setApplied({});
      setQuery({});
      setStatus("전체");
      setPage(1);
      setSelected(sensorId);
      setSelectedRows(
        rowSelectionHiddenScreens.includes(current) ? [] : [sensorId],
      );
      setDraft({});
      setSensorMode("view");
      notify("새 센서를 등록했습니다.");
      return;
    }
    update(draft);
    setSensorMode("view");
  };
  const accessDatePresets = [
    ["당일", 0],
    ["1주일", 6],
    ["1개월", 29],
    ["3개월", 89],
    ["6개월", 179],
  ];
  const selectAccessPeriod = (days) => {
    const to = query.to || "2026-10-08";
    const fromDate = new Date(`${to}T00:00:00`);
    fromDate.setDate(fromDate.getDate() - days);
    const from = new Date(
      fromDate.getTime() - fromDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 10);
    applyQuery({ ...query, from, to });
  };
  const isAccessPeriod = (days) => {
    const from = query.from || "2026-10-01";
    const to = query.to || "2026-10-08";
    return Math.round((Date.parse(to) - Date.parse(from)) / 86400000) === days;
  };
  return (
    <>
          <section className={`work-panel screen-format-${screenFormat} ${conf.layout === "tree" ? "tree-work-panel" : ""}`} aria-label={`${name} 업무 영역`}>
          {[
            "MES-TD3-001",
            "MES-TD3-002",
            "MES-TD3-003",
            "MES-TD3-005",
            "MES-TD3-007",
            "MES-TD3-008",
            "MES-TD3-009",
            "MES-TD3-011",
            "MES-TD3-012",
            "MES-TD3-013",
            "MES-TD3-014",
            "MES-TD3-015",
            "MES-TD3-022",
            "MES-TD3-018",
            "MES-TD3-019",
            "MES-TD3-020",
            "MES-TD3-021",
          ].includes(current) ? (
            <SearchConditions
              className="access-filter-panel"
              title=""
              ariaLabel={`${name} 조회 조건`}
              keyword={query.keyword || ""}
              onKeywordChange={(keyword) => applyQuery({ ...query, keyword })}
              onReset={() => {
                setQuery({});
                setApplied({});
                setStatus("전체");
                setPage(1);
              }}
            >
              <div
                className="filter-grid access-filter-grid"
                style={{
                  "--access-filter-columns": conf.filters.length - 1,
                }}
              >
                <label className="access-date-field">
                  <span>조회기간</span>
                  <div className="access-date-content">
                    <div className="date-inputs">
                      <input
                        aria-label="시작일"
                        type="date"
                        value={query.from || "2026-10-01"}
                        onChange={(e) =>
                          applyQuery({ ...query, from: e.target.value })
                        }
                      />
                      <span>—</span>
                      <input
                        aria-label="종료일"
                        type="date"
                        min={query.from || "2026-10-01"}
                        value={query.to || "2026-10-08"}
                        onChange={(e) =>
                          applyQuery({ ...query, to: e.target.value })
                        }
                      />
                    </div>
                    <div className="access-period-options" aria-label="조회기간 빠른 선택">
                      {accessDatePresets.map(([label, days]) => (
                        <label key={label}>
                          <input
                            type="radio"
                            name="access-period"
                            checked={isAccessPeriod(days)}
                            onChange={() => selectAccessPeriod(days)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </label>
                {conf.filters.slice(1).map((field) => (
                  <label key={field}>
                    <span>{field}</span>
                    <DropDownMenu
                      value={query[field] || ""}
                      onChange={(e) =>
                        applyQuery({ ...query, [field]: e.target.value })
                      }
                    >
                      <option value="">전체 {field}</option>
                      {options(field, rows).map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </DropDownMenu>
                  </label>
                ))}
              </div>
            </SearchConditions>
          ) : conf.filters.length > 0 && <SearchConditions
            className={`standard-filter-panel ${
              current === "MES-TD3-006" ? "single-row-filter-panel" : ""
            }`}
            title=""
            ariaLabel={`${name} 조회 조건`}
            keyword={query.keyword || ""}
            onKeywordChange={(keyword) => applyQuery({ ...query, keyword })}
            onReset={() => {
              setQuery({});
              setApplied({});
              setStatus("전체");
              setPage(1);
            }}
          >
            <div
              className={`filter-grid standard-filter-grid ${
                current === "MES-TD3-006" ? "single-row-filter-grid" : ""
              }`}
              data-count={conf.filters.length}
              style={{
                "--filter-columns":
                  conf.filters.length > 4 ? 3 : conf.filters.length,
              }}
            >
              {conf.filters.map((f) => (
                <label
                  key={f}
                  className={
                    f === "기간" || f.includes("일자")
                      ? "date-field"
                      : f === "자동 새로고침"
                        ? "toggle-field"
                        : f.length >= 7
                          ? "wide-field"
                          : ""
                  }
                >
                  <span>{f}</span>
                  {f === "기간" || f.includes("일자") ? (
                    <div className="date-inputs">
                      <input
                        aria-label="시작일"
                        type="date"
                        value={query.from || "2026-10-01"}
                        onChange={(e) =>
                          applyQuery({ ...query, from: e.target.value })
                        }
                      />
                      <span>—</span>
                      <input
                        aria-label="종료일"
                        type="date"
                        min={query.from || "2026-10-01"}
                        value={query.to || "2026-10-08"}
                        onChange={(e) =>
                          applyQuery({ ...query, to: e.target.value })
                        }
                      />
                    </div>
                  ) : f === "자동 새로고침" ? (
                    <span className="radio-options" role="radiogroup" aria-label={f}>
                      {[true, false].map((enabled) => (
                        <Checkbox inputType="radio" shape="circle"
                          key={String(enabled)}
                          name="monitor-auto-refresh"
                          value={String(enabled)}
                          checked={(query[f] ?? true) === enabled}
                          onChange={() => setQuery({ ...query, [f]: enabled })}
                        >
                          {enabled ? "사용" : "미사용"}
                        </Checkbox>
                      ))}
                    </span>
                  ) : (
                    <DropDownMenu
                      value={query[f] || ""}
                      onChange={(e) =>
                        applyQuery({ ...query, [f]: e.target.value })
                      }
                    >
                      <option value="">전체 {f}</option>
                      {options(f, rows).map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </DropDownMenu>
                  )}
                </label>
              ))}
              <span className="filter-empty empty-one" aria-hidden="true" />
            </div>
          </SearchConditions>}
          {conf.layout !== "tree" && (
            <div className="list-actions" aria-label="목록 작업">
              <span className="table-result-count" role="status">총 {sorted.length}건</span>
              {canExport && (
                <Button variant="weak" className="export-button" icon={DownloadIcon} onClick={exportCsv}>
                  엑셀 내보내기
                </Button>
              )}
              {conf.download && (
                <Button
                  variant="weak"
                  icon={DownloadIcon}
                  disabled={!row}
                  onClick={downloadSnapshot}
                >
                  스냅샷 내려받기
                </Button>
              )}
              {supportsDelete && selectedRows.length > 0 && (
                <Button
                  variant="fill"
                  className="danger-button"
                  icon={TrashIcon}
                  disabled={!deletableSelectedRows.length}
                  onClick={() => setModal("delete")}
                >
                  삭제
                </Button>
              )}
              {canCreate && selectedRows.length === 0 && (
                <Button
                  variant="fill"
                  icon={PlusIcon}
                  onClick={() =>
                    conf.detail === "sensor"
                      ? beginSensorCreate()
                      : setModal("add")
                  }
                >
                  {conf.actions.createLabel || "추가"}
                </Button>
              )}
            </div>
          )}
          {conf.layout === "tree" ? (
            <section className="tree-editor-panel" aria-label="점검 문서 및 목차 편집">
              <TreeView
                nodes={treeNodes}
                selectedId={treeSelected}
                expanded={treeExpanded}
                query={treeQuery}
                onQueryChange={setTreeQuery}
                onToggle={toggleTreeNode}
                onSelect={selectTreeNode}
                onAddDocument={() => addTreeNode("document")}
              />
              <DetailPanel
                nodes={treeNodes}
                selectedId={treeSelected}
                activeTab={treeTab}
                mode={treeMode}
                draft={treeDraft}
                onTab={(type) => { setTreeTab(type); setTreeMode("view"); setTreeDraft({}); }}
                onEdit={() => { setTreeMode("edit"); setTreeDraft({}); }}
                onCancel={() => {
                  if (treeMode === "create") {
                    const created = treeNodes.find((node) => node.id === treeSelected);
                    setTreeNodes((currentNodes) => currentNodes.filter((node) => node.id !== treeSelected));
                    const fallback = treeNodes.find((node) => node.id === created?.parentId) || treeNodes.find((node) => node.id !== treeSelected);
                    setTreeSelected(fallback?.id || null);
                    setTreeTab(fallback?.type || "document");
                    setTreeDraft({});
                    setTreeMode("view");
                  } else {
                    setTreeDraft({});
                    setTreeMode("view");
                  }
                }}
                onSave={saveTree}
                onDraft={(field, value) => setTreeDraft((currentDraft) => ({ ...currentDraft, [field]: value }))}
                onAdd={addTreeNode}
                onDelete={deleteTreeNode}
                onSelect={selectTreeNode}
                onMove={moveTreeNode}
              />
            </section>
          ) : (
          <section className={`table-panel screen-format-${screenFormat} ${conf.layout ? `${conf.layout}-screen` : ""}`} aria-label="조회 결과">
            <DataTable
              columns={conf.cols}
              rows={visible}
              selectable={showRowSelection}
              selectedId={selected}
              selectedIds={selectedRows}
              sortColumn="발생일시"
              sortAscending={sort}
              onSort={() => setSort(!sort)}
              onRowClick={selectRow}
              onRowDoubleClick={(id) => {
                if (inlineDetail) return;
                setSelected(id);
                setDraft({});
                if (conf.detail) setDetailOpen(true);
              }}
              onToggleRow={toggleRowSelection}
              onToggleAll={toggleAllRowSelection}
              renderCell={(item, column, index) =>
                /상태|단계|결과/.test(column) ? (
                  <StatusBadge value={raw(column, item, index)} />
                ) : /일시$/.test(column) ? (
                  <span className="date-line">
                    {formatDateTime(raw(column, item, index))}
                  </span>
                ) : raw(column, item, index)
              }
              emptyState={(
                <div className="empty">
                  <StateEmoji code="u1F50D" size={52} />
                  <h3>조회 결과가 없습니다</h3>
                  <p>기간이나 상태 조건을 변경해 보세요.</p>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setApplied({});
                      setQuery({});
                      setStatus("전체");
                      setPage(1);
                    }}
                  >
                    조건 초기화
                  </button>
                </div>
              )}
            />
            {conf.layout === "snapshot" && (
              <aside className="snapshot-preview" aria-label="이벤트 스냅샷 상세">
                {row ? (
                  <>
                    <div className="snapshot-sequence">
                      {["감지 3초 전", "감지 시점", "감지 3초 후"].map((label, index) => (
                        <figure key={label} className={index === 1 ? "detected" : ""}>
                          <img src={factoryEventDemoUrl} alt={`${label} 샘플 스냅샷`} />
                          <figcaption>{label}</figcaption>
                        </figure>
                      ))}
                    </div>
                    <dl className="snapshot-facts">
                      <div><dt>발생일시</dt><dd>{row.time}</dd></div>
                      <div><dt>위치</dt><dd>{row.location}</dd></div>
                      <div><dt>유형</dt><dd>{row.type}</dd></div>
                      <div><dt>신뢰도</dt><dd>97.4%</dd></div>
                    </dl>
                  </>
                ) : (
                  <div className="snapshot-placeholder">
                    <span className="snapshot-empty-icon" aria-hidden="true">
                      <CameraIcon size={36} aria-hidden="true" />
                    </span>
                    <p>이벤트를 선택하면 상세 정보가 표시됩니다.</p>
                  </div>
                )}
              </aside>
            )}
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            {conf.layout === "equipment-events" && (
              <section
                className="equipment-events-detail"
                aria-labelledby="equipment-events-title"
              >
                <div className="equipment-events-heading">
                  <h2 id="equipment-events-title">위에서 선택한 장비의 이벤트</h2>
                  {row && <span>{row.equipment}</span>}
                </div>
                <div className="equipment-events-table">
                  <table>
                    <thead>
                      <tr>
                        <th>이벤트ID</th>
                        <th>발생일시</th>
                        <th>이벤트 유형</th>
                        <th>위험 단계</th>
                        <th>처리 상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(row ? initialRows.slice(0, 3) : []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td><span className="date-line">{formatDateTime(item.time)}</span></td>
                          <td>{item.type}</td>
                          <td><StatusBadge value={item.level} /></td>
                          <td><StatusBadge value={item.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!row && (
                    <p className="equipment-events-empty">
                      위 목록에서 장비를 선택해 주세요.
                    </p>
                  )}
                </div>
              </section>
            )}
          </section>
          )}
          </section>
          {row && conf.detail && (
            <dialog
              ref={detailDialog}
              open={inlineDetail || undefined}
              className={`detail-panel detail-dialog screen-format-${screenFormat} ${inlineDetail ? "inline-detail-panel" : ""} ${conf.detail === "sensor" ? "sensor-detail-panel" : ""}`}
              onCancel={(e) => {
                if (inlineDetail) e.preventDefault();
                else setDetailOpen(false);
              }}
              onClick={(e) => {
                if (!inlineDetail && e.target === detailDialog.current)
                  setDetailOpen(false);
              }}
              aria-labelledby="detail-dialog-title"
            >
              <div className="detail-header">
                <div>
                  <StateEmoji code="u1F4DD" size={28} />
                  <h2 id="detail-dialog-title">
                    {suffix === "015" ? "이벤트 상세 및 조치" : "상세 정보"}
                  </h2>
                </div>
                <div className="detail-header-actions">
                  {inlineDetail && canSave ? (
                    sensorMode === "view" ? (
                      <>
                        {canDelete && (
                          <button
                            className="danger-button"
                            onClick={() => setModal("delete")}
                          >
                            <TrashIcon size={14} aria-hidden="true" />
                            삭제
                          </button>
                        )}
                        <button
                          className="secondary export-button"
                          onClick={() => {
                            setDraft({});
                            setSensorMode("edit");
                          }}
                        >
                          수정
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="secondary export-button"
                          onClick={() => {
                            setDraft({});
                            setSensorMode("view");
                          }}
                        >
                          취소
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            if (conf.detail === "sensor") saveSensor();
                            else update(draft);
                          }}
                        >
                          저장
                        </button>
                      </>
                    )
                  ) : !inlineDetail ? (
                    <StatusBadge value={row.status} />
                  ) : null}
                  {!inlineDetail && (
                    <button
                      className="icon-btn"
                      onClick={() => setDetailOpen(false)}
                      aria-label="상세 정보 닫기"
                    >
                      <CloseIcon size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div
                className={`detail-body ${conf.detail === "log" ? "log-body" : ""}`}
              >
                {["event", "snap"].includes(conf.detail) && (
                  <figure className="evidence">
                    <button
                      onClick={() => setModal("image")}
                      aria-label="샘플 스냅샷 확대"
                    >
                      <img
                        src={factoryEventDemoUrl}
                        alt="AI로 생성한 프레스 설비와 안전구역의 작업자 샘플"
                      />
                      <span className="image-label">CAM 08 · 스냅샷</span>
                      <span className="expand-label">확대 보기 ↗</span>
                    </button>
                    <figcaption>
                      <span>현장 스냅샷</span>
                      <span>AI 생성 샘플 · 실제 촬영 아님</span>
                    </figcaption>
                  </figure>
                )}
                {conf.detail === "log" ? (
                  <pre>
                    {JSON.stringify(
                      {
                        eventId: row.id,
                        source: "AI_CCTV",
                        receivedAt: row.time,
                        result: "SUCCESS",
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : conf.detail === "sensor" ? (
                  <div className="sensor-detail-grid">
                    {sensorFields.map((field) => {
                        const choices = detailChoices(field);
                        const editing = sensorMode !== "view";
                        const locked = field === "센서ID" && sensorMode === "edit";
                        return (
                          <div
                            key={field}
                            className={`sensor-detail-field ${field === "사용 여부" ? "full-row" : ""}`}
                          >
                            <span>{field}</span>
                            {!editing || locked ? (
                              <span className={`sensor-detail-value${locked ? " is-locked" : ""}`}>
                                {fieldValue(field) || "-"}
                              </span>
                            ) : choices ? (
                              <DropDownMenu
                                aria-label={field}
                                value={fieldValue(field)}
                                onChange={(e) =>
                                  setDraft({ ...draft, [field]: e.target.value })
                                }
                              >
                                <option value="">선택</option>
                                {choices.map((choice) => (
                                  <option key={choice}>{choice}</option>
                                ))}
                              </DropDownMenu>
                            ) : (
                              <input
                                aria-label={field}
                                value={fieldValue(field)}
                                placeholder={field}
                                onChange={(e) =>
                                  setDraft({ ...draft, [field]: e.target.value })
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : conf.detail === "tree" ? null : (
                  <div className={`detail-form ${conf.detail === "training" ? "training-detail-form" : ""}`}>
                    {["event", "snap"].includes(conf.detail) && (
                      <div className="event-facts">
                        <div>
                          <span>발생 설비</span>
                          <strong>{row.equipment}</strong>
                        </div>
                        <div>
                          <span>발생 위치</span>
                          <strong>{row.location}</strong>
                        </div>
                        <div>
                          <span>이벤트 유형</span>
                          <strong>{row.type}</strong>
                        </div>
                      </div>
                    )}
                    {conf.detail !== "snap" && (
                      <>
                        {tabbedDetail && (
                          <div
                            className="detail-section-tabs"
                            role="tablist"
                            aria-label={`${name} 상세 정보`}
                            ref={detailTabsElement}
                          >
                            {detailTabs.map((section) => (
                              <button
                                key={section.title}
                                id={`${conf.detail}-tab-${section.title}`}
                                type="button"
                                role="tab"
                                aria-selected={activeDetailTab === section.title}
                                className={activeDetailTab === section.title ? "active" : ""}
                                onClick={() => setDetailSectionTab(section.title)}
                              >
                                {section.title}
                              </button>
                            ))}
                            <span
                              className="detail-tab-indicator"
                              ref={detailTabIndicator}
                              aria-hidden="true"
                            />
                          </div>
                        )}
                        {(detailSections[conf.detail] || detailSections.form)
                          .filter(
                            (section) =>
                              !tabbedDetail ||
                              section.title === activeDetailTab,
                          )
                          .map(
                        (section) => (
                          <section
                            className="field-section"
                            key={section.title}
                            role={tabbedDetail ? "tabpanel" : undefined}
                            aria-labelledby={
                              tabbedDetail
                                ? `${conf.detail}-tab-${section.title}`
                                : undefined
                            }
                          >
                            {!tabbedDetail && <h3>{section.title}</h3>}
                            <div className="fields">
                              {section.fields.map((f) => {
                                const choices = detailChoices(f);
                                return (
                                  <label
                                    key={f}
                                    className={
                                      /내용|사유|비고|사항|결과|근거자료/.test(f)
                                        ? "wide"
                                        : ""
                                    }
                                  >
                                    <span>{f}</span>
                                    {inlineDetail && sensorMode === "view" ? (
                                      <span className="detail-field-value">{fieldValue(f) || "-"}</span>
                                    ) : choices ? (
                                      <DropDownMenu
                                        value={fieldValue(f)}
                                        onChange={(e) =>
                                          setDraft({ ...draft, [f]: e.target.value })
                                        }
                                      >
                                        {choices.map((choice) => (
                                          <option key={choice}>{choice}</option>
                                        ))}
                                      </DropDownMenu>
                                    ) : /내용|사유|비고|사항|결과|근거자료/.test(f) ? (
                                      <textarea
                                        placeholder={`${f} 입력`}
                                        value={fieldValue(f)}
                                        onChange={(e) =>
                                          setDraft({ ...draft, [f]: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <input
                                        value={fieldValue(f)}
                                        placeholder={f}
                                        onChange={(e) =>
                                          setDraft({ ...draft, [f]: e.target.value })
                                        }
                                      />
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </section>
                        ),
                      )}
                      </>
                    )}
                    {conf.detail === "snap" && (
                      <p className="evidence-note">
                        화면 구성을 위한 샘플 이미지입니다. 실제 영상 및 전후
                        스냅샷은 연결되지 않았습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {canSave && conf.detail !== "sensor" && !inlineDetail && (
                <footer className="detail-footer">
                  <span>
                    {dirty
                      ? "저장하지 않은 변경 사항이 있습니다."
                      : "변경 사항은 현재 화면 세션에만 저장됩니다."}
                  </span>
                  <div>
                    {canDelete && (
                      <button
                        className="danger-button"
                        onClick={() => setModal("delete")}
                      >
                        <TrashIcon size={16} aria-hidden="true" />
                        삭제
                      </button>
                    )}
                    {conf.approve && (
                      <>
                        <button
                          className="secondary"
                          onClick={() => update({ approval: "반려" })}
                        >
                          반려
                        </button>
                        <button
                          className="secondary"
                          onClick={() => update({ approval: "승인" })}
                        >
                          승인
                        </button>
                      </>
                    )}
                    <button
                      className="secondary"
                      disabled={!dirty}
                      onClick={() => setDraft({})}
                    >
                      변경 취소
                    </button>
                    <button
                      className="primary"
                      disabled={!dirty}
                      onClick={() =>
                        update({
                          ...draft,
                          status:
                            draft["처리 상태"] ||
                            draft["확인 상태"] ||
                            draft["조치 상태"] ||
                            row.status,
                          owner: draft["담당자"] || row.owner,
                        })
                      }
                    >
                      <CheckIcon size={16} aria-hidden="true" />
                      변경 저장
                    </button>
                  </div>
                </footer>
              )}
            </dialog>
          )}
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="modal-head">
          <h2 id="dialog-title">
            {modal === "image"
              ? "현장 스냅샷"
              : modal === "delete"
                ? "등록한 항목 삭제"
                : suffix === "013"
                  ? "수동 등록"
                  : suffix === "022"
                    ? "항목 등록"
                    : "항목 추가"}
          </h2>
          <button
            className="icon-btn"
            onClick={() => setModal(null)}
            aria-label="대화상자 닫기"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>
        {modal === "image" ? (
          <>
            <img
              className="large-evidence"
              src={factoryEventDemoUrl}
              alt="AI 생성 공장 스냅샷 확대"
            />
            <p>AI 생성 샘플 · 실제 촬영 아님</p>
          </>
        ) : modal === "delete" ? (
          <>
            <p>
              {deleteTargetIds.length > 1
                ? `선택한 ${deleteTargetIds.length}개 항목을 화면에서 삭제합니다.`
                : "선택한 항목을 화면에서 삭제합니다."}
            </p>
            <button
              className="danger-button"
              onClick={() => {
                const deleteIds = new Set(deleteTargetIds);
                const remainingRows = rows.filter((item) => !deleteIds.has(item.id));
                const nextSelectedRows = selectedRows.filter((id) => !deleteIds.has(id));
                setRecords({
                  ...records,
                  [current]: remainingRows,
                });
                setSelectedRows(nextSelectedRows);
                setSelected(
                  selected && !deleteIds.has(selected)
                    ? selected
                    : nextSelectedRows.at(-1) || remainingRows[0]?.id || null,
                );
                setDetailSectionTab("학습 후보");
                setModal(null);
                notify(
                  deleteIds.size > 1
                    ? `${deleteIds.size}개 항목을 삭제했습니다.`
                    : "등록 항목을 삭제했습니다.",
                );
              }}
            >
              <TrashIcon size={16} aria-hidden="true" />
              삭제
            </button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = `MAN-${Date.now().toString().slice(-6)}`;
              setRecords({
                ...records,
                [current]: [
                  {
                    ...initialRows[0],
                    id,
                    type: newType,
                    equipment: newEquipment,
                    status: "미확인",
                    manual: true,
                  },
                  ...rows,
                ],
              });
              setApplied({});
              setQuery({});
              setStatus("전체");
              setPage(1);
              setSelected(id);
              setSelectedRows(
                rowSelectionHiddenScreens.includes(current) ? [] : [id],
              );
              setDetailSectionTab("학습 후보");
              setDraft({});
              setModal(null);
              notify("새 항목을 화면에 등록했습니다.");
            }}
          >
            <label>
              설비
              <DropDownMenu
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
              >
                {initialRows.map((r) => (
                  <option key={r.equipment}>{r.equipment}</option>
                ))}
              </DropDownMenu>
            </label>
            <label>
              이벤트 유형
              <DropDownMenu
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {initialRows.map((r) => (
                  <option key={r.type}>{r.type}</option>
                ))}
              </DropDownMenu>
            </label>
            <p className="subtle">
              샘플 데이터로 등록되며 새로고침하면 초기화됩니다.
            </p>
            <button className="primary" type="submit">
              등록
            </button>
          </form>
        )}
      </dialog>
      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </>
  );
}
