function formatDateTime(value) {
  return value ? String(value).replace("T", " ").slice(0, 19) : "";
}

function formatConfidence(value) {
  if (value == null || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? `${(number <= 1 ? number * 100 : number).toFixed(1)}%` : "";
}

function normalizeItemName(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

export function buildInspectionEventPrefill(items, event, { eventTypeName, riskName, factoryName } = {}) {
  if (!event) return {};

  const valuesByName = {
    이벤트id: event.eventNo,
    이벤트번호: event.eventNo,
    발생일시: formatDateTime(event.occurDt),
    수집일시: formatDateTime(event.collectDt),
    발생원: event.sourceType,
    공장: factoryName || event.factoryCd,
    카메라: event.cameraNm,
    카메라명: event.cameraNm,
    감지구역: event.zoneNm,
    감지구역명: event.zoneNm,
    설비: event.equipCd,
    설비코드: event.equipCd,
    위치: event.locDesc,
    이벤트유형: eventTypeName || event.eventTypeCd,
    위험단계: riskName || event.riskLvCd,
    ai신뢰도: formatConfidence(event.confidence),
    원천이벤트: event.rawNo,
    등록구분: { MANUAL: "수동", AUTO: "자동" }[event.regType],
  };

  return Object.fromEntries(items.flatMap((item) => {
    if (item.inputMtdCd !== "TEXT") return [];
    const value = valuesByName[normalizeItemName(item.itemNm)];
    return value == null || String(value).trim() === ""
      ? []
      : [[`${item.secNo}|${item.itemNo}`, String(value).slice(0, 200)]];
  }));
}
