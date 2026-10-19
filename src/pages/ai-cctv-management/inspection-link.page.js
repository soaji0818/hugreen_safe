export default {
  id: "MES-TD3-021",
  title: "이벤트 안전점검일지 연계",
  config: {
    actions: { save: true },
    filters: ["기간", "공장", "설비", "이벤트 유형"],
    cols: ["이벤트ID", "발생일시", "설비", "이벤트 유형", "위험 단계", "점검 등록 여부", "점검번호"],
    detail: "link",
  },
};
