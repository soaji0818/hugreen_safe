export default {
  id: "MES-TD3-012",
  title: "점검 이력·보관 관리",
  config: {
    actions: { save: true, delete: true },
    filters: ["기간", "점검 문서", "설비", "점검자", "승인 상태"],
    cols: ["점검번호", "점검일자", "문서명", "설비", "승인자", "보관 상태"],
    detail: "history",
  },
};
