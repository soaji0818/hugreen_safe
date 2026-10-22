import CctvEventIngestionPage from "./cctv-event-ingestion.component";

export default {
  id: "MES-TD3-018",
  title: "AI CCTV 이벤트 수집",
  Component: CctvEventIngestionPage,
  config: {
    actions: { save: true, export: true, create: true, createLabel: "추가" },
    summary: ["오늘 수신", "확인 대기", "스냅샷"],
    filters: ["수신기간", "이벤트 유형", "카메라", "등록 구분"],
    cols: ["수신번호", "발생일시", "카메라명", "구역", "이벤트 유형", "해제일시", "스냅샷", "확인 상태"],
    detail: "receive",
  },
};
