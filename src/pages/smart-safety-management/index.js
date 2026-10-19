import dangerAlerts from "./danger-alerts.page";
import dangerZoneEvents from "./danger-zone-events.page";
import eventProcessingHistory from "./event-processing-history.page";
import inspectionDocuments from "./inspection-documents.page";
import inspectionHistory from "./inspection-history.page";
import inspectionResults from "./inspection-results.page";
import riskEvents from "./risk-events.page";
import safetyLogs from "./safety-logs.page";
import workerAccessEvents from "./worker-access-events.page";

export const smartSafetyPages = [
  workerAccessEvents,
  safetyLogs,
  eventProcessingHistory,
  inspectionDocuments,
  inspectionResults,
  inspectionHistory,
  dangerZoneEvents,
  dangerAlerts,
  riskEvents,
];
