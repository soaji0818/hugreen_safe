export default {
  id: "MES-TD3-001",
  title: "이벤트 클립 추출",
  config: {
    layout: "snapshot",
    exportable: false,
    filters: ["기간", "공장", "카메라", "이벤트 유형"],
    cols: ["이벤트ID", "수신일시", "공장", "카메라", "이벤트 유형", "스냅샷 수"],
    detail: "snap",
  },
};
