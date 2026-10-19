export default {
  id: "MES-TD3-022",
  title: "장비 이벤트 장애관리",
  config: {
    actions: { save: true, export: true, create: true, createLabel: "등록" },
    filters: ["기간", "장비 구분", "장애 유형", "처리 상태"],
    cols: ["장애번호", "발생일시", "장비", "위치", "장애 유형", "처리 상태", "담당자", "복구일시"],
    detail: "failure",
  },
};
