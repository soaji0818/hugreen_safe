export default {
  id: "MES-TD3-008",
  title: "안전 로그 조회",
  config: {
    actions: { export: true },
    filters: ["기간", "공장", "설비", "발생원", "이벤트 유형"],
    cols: ["이벤트ID", "발생일시", "공장", "설비", "위치", "이벤트 유형", "발생원"],
    detail: "log",
  },
};
