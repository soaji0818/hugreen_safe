export default {
  id: "MES-TD3-020",
  title: "장비별 이벤트 조회",
  config: {
    actions: { export: true },
    layout: "equipment-events",
    filters: ["기간", "공장", "설비(카메라)", "이벤트 유형", "조치 상태"],
    cols: ["장비ID", "장비명", "이벤트 건수", "위험 건수", "미조치", "최종 발생일시"],
  },
};
