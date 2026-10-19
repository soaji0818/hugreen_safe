export default {
  id: "MES-TD3-011",
  title: "점검 결과 입력·승인",
  config: {
    actions: { save: true, create: true, delete: true, createLabel: "추가" },
    filters: ["점검일자", "점검 문서", "설비", "승인 상태"],
    cols: ["점검번호", "점검일자", "문서명", "설비", "점검자", "승인 상태"],
    detail: "inspection",
    approve: true,
  },
};
