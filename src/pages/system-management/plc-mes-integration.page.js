export default {
  id: "MES-TD3-006",
  title: "PLC·MES 연계관리",
  config: {
    actions: { save: true, create: true, createLabel: "추가" },
    filters: ["공장", "설비", "센서 유형"],
    cols: ["센서ID", "센서명", "센서 유형", "공장", "설치 설비", "통신 방식", "PLC 입력주소", "연계 상태", "최종 수신시각"],
    detail: "sensor",
  },
};
