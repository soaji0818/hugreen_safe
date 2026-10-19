export default {
  id: "MES-TD3-002",
  title: "영상 이력 검색",
  config: {
    layout: "snapshot",
    filters: ["기간", "공장", "카메라(구역)", "이벤트 유형"],
    cols: ["이벤트ID", "발생일시", "공장", "구역", "이벤트 유형", "영상"],
    detail: "snap",
    download: true,
  },
};
