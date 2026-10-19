export default {
  id: "MES-TD3-019",
  title: "현장 경고·경보 이력관리",
  config: {
    actions: { save: true, export: true },
    filters: ["기간", "카메라·설비", "경보 유형", "상태"],
    cols: ["경보번호", "발생일시", "설비", "경보 유형", "발송 주체", "발송 결과", "확인자"],
    detail: "alarm",
  },
};
