export default {
  id: "MES-TD3-004",
  title: "MES/NVR/VMS 연계관리",
  config: {
    actions: { export: true },
    filters: ["공장", "연계 대상", "데이터 유형"],
    cols: ["카메라ID", "카메라명", "공장", "연계 대상", "데이터 유형", "연계 상태", "최근 연계시각"],
  },
};
