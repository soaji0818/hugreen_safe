export default {
  id: "MES-TD3-005",
  title: "설비 연계 상태 로그 관리",
  config: {
    filters: ["기간", "연계 대상", "장비", "로그 유형"],
    cols: ["로그번호", "발생일시", "연계 대상", "장비", "로그 유형", "결과", "오류 내용"],
    detail: "log",
  },
};
