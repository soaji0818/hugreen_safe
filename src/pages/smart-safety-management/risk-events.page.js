export default {
  id: "MES-TD3-015",
  title: "위험 이벤트 관리",
  config: {
    actions: { save: true, export: true, create: true, delete: true, createLabel: "추가" },
    summary: ["전체 이벤트", "미조치", "조치 완료율"],
    filters: ["기간", "공장", "설비", "이벤트 유형", "처리 상태"],
    cols: ["이벤트ID", "발생일시", "공장", "설비", "이벤트 유형", "위험 단계", "처리 상태", "담당자", "등록 구분"],
    detail: "event",
  },
};
