import cctvMaster from "./cctv-master/cctv-master.page.jsx";
import cctvMasterBottom from "./cctv-master/cctv-master-bottom.page.jsx";
import cctvMasterPanel from "./cctv-master/cctv-master-panel.page.jsx";
import cctvMasterShrinkPanel from "./cctv-master/cctv-master-shrink-panel.page.jsx";
import cctvMonitoring from "./cctv-monitoring.page.jsx";
import equipmentFailures from "./equipment-failures.page.jsx";
import CctvEventIngestionPage from "./cctv-event-ingestion.component";
import FieldAlertHistoryPage from "./field-alert-history.component";
import EquipmentEventsPage from "./equipment-events.component";
import InspectionLinkPage from "./inspection-link.component";

const dedicatedPages = [
  { id: "MES-TD3-018", title: "AI CCTV 이벤트 수집", Component: CctvEventIngestionPage, config: {} },
  { id: "MES-TD3-019", title: "현장 경고·경보 이력관리", Component: FieldAlertHistoryPage, config: {} },
  { id: "MES-TD3-020", title: "장비별 이벤트 조회", Component: EquipmentEventsPage, config: {} },
  { id: "MES-TD3-021", title: "이벤트 안전점검일지 연계", Component: InspectionLinkPage, config: {} },
];

export const aiCctvPages = [
  cctvMaster,
  cctvMonitoring,
  equipmentFailures,
  ...dedicatedPages,
];

export const aiCctvHiddenPages = [
  cctvMasterPanel,
  cctvMasterShrinkPanel,
  cctvMasterBottom,
];
