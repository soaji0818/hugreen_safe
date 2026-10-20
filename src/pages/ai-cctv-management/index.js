import cctvMaster from "./cctv-master.page.jsx";
import cctvMasterBottom from "./cctv-master-bottom.page.jsx";
import cctvMasterPanel from "./cctv-master-panel.page.jsx";
import cctvMasterShrinkPanel from "./cctv-master-shrink-panel.page.jsx";
import cctvMonitoring from "./cctv-monitoring.page.jsx";
import equipmentFailures from "./equipment-failures.page";
import cctvEventIngestion from "./cctv-event-ingestion.page";
import fieldAlertHistory from "./field-alert-history.page";
import equipmentEvents from "./equipment-events.page";
import inspectionLink from "./inspection-link.page";

export const aiCctvPages = [
  cctvMaster,
  cctvMonitoring,
  equipmentFailures,
  cctvEventIngestion,
  fieldAlertHistory,
  equipmentEvents,
  inspectionLink,
];

export const aiCctvHiddenPages = [
  cctvMasterPanel,
  cctvMasterShrinkPanel,
  cctvMasterBottom,
];
