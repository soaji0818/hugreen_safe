export default {
  id: "MES-TD3-003",
  title: "AI 학습데이터 관리",
  config: {
    actions: { save: true, create: true, delete: true, createLabel: "추가" },
    summary: ["운영 모델", "데이터 건수", "최근 적용일"],
    filters: ["기간", "카메라", "이벤트 유형", "후보 상태"],
    cols: ["후보번호", "등록일", "이벤트ID", "카메라", "이벤트 유형", "등록 사유", "후보 상태", "반영 모델 버전"],
    detail: "training",
  },
};
