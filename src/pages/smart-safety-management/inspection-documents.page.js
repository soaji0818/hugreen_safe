export default {
  id: "MES-TD3-010",
  title: "점검 문서·목차 관리",
  config: {
    actions: { save: true, create: true, delete: true, createLabel: "추가" },
    layout: "tree",
    filters: [],
    cols: ["목차 코드", "점검 문서", "점검 항목", "입력 방식", "정렬 순서"],
    detail: "tree",
  },
};
