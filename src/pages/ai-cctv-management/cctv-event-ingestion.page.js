export default {
  id: "MES-TD3-018",
  title: "AI CCTV 이벤트 수집",
  config: {
    actions: { save: true, export: true, create: true, createLabel: "추가" },
    summary: ["오늘 수신", "확인 대기", "스냅샷"],
    filters: ["기간", "카메라", "이벤트 유형", "확인 상태"],
    cols: ["수신번호", "수신일시", "발생일시", "외부 이벤트ID", "카메라ID", "이벤트 유형", "스냅샷 수", "확인 상태"],
    detail: "receive",
  },
};
