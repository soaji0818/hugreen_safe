export default {
  id: "MES-TD3-013",
  title: "위험구역 접근 이벤트 수집",
  config: {
    actions: { create: true, createLabel: "수동 등록" },
    filters: ["기간", "공장", "위험구역", "등록 구분"],
    cols: ["수집번호", "발생일시", "카메라", "위치", "감지구역", "이벤트 유형", "수집 결과"],
  },
};
