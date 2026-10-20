import { aiCctvHiddenPages, aiCctvPages } from "./ai-cctv-management";
import { smartSafetyPages } from "./smart-safety-management";
import { systemManagementPages } from "./system-management";
import StandardPage from "../components/page/StandardPage";

const routeByPageId = {
  "MES-TD3-001": "/system/event-clips",
  "MES-TD3-002": "/system/video-history",
  "MES-TD3-003": "/system/training-data",
  "MES-TD3-004": "/system/external-integrations",
  "MES-TD3-005": "/system/integration-logs",
  "MES-TD3-006": "/system/plc-mes-integration",
  "MES-TD3-007": "/safety/worker-access-events",
  "MES-TD3-008": "/safety/logs",
  "MES-TD3-009": "/safety/event-processing-history",
  "MES-TD3-010": "/safety/inspection-documents",
  "MES-TD3-011": "/safety/inspection-results",
  "MES-TD3-012": "/safety/inspection-history",
  "MES-TD3-013": "/safety/danger-zone-events",
  "MES-TD3-014": "/safety/danger-alerts",
  "MES-TD3-015": "/safety/risk-events",
  "MES-TD3-016": "/ai-cctv/cameras",
  "MES-TD3-016-PANEL": "/ai-cctv/cameras/panel",
  "MES-TD3-016-SHRINK-PANEL": "/ai-cctv/cameras/shrink-panel",
  "MES-TD3-016-BOTTOM": "/ai-cctv/cameras/bottom",
  "MES-TD3-017": "/ai-cctv/monitoring",
  "MES-TD3-022": "/ai-cctv/equipment-failures",
  "MES-TD3-018": "/ai-cctv/event-ingestion",
  "MES-TD3-019": "/ai-cctv/field-alert-history",
  "MES-TD3-020": "/ai-cctv/equipment-events",
  "MES-TD3-021": "/ai-cctv/inspection-link",
};

const pageGroups = [
  { name: "시스템 관리", icon: "⚙", pages: systemManagementPages },
  { name: "스마트 안전관리", icon: "◇", pages: smartSafetyPages },
  { name: "AI CCTV 관리", icon: "◉", pages: aiCctvPages },
];

export const groups = pageGroups.map(({ name, icon, pages }) => ({
  name,
  icon,
  items: pages.map(({ id, title }) => [id, title]),
}));

export const pages = Object.fromEntries(
  [...pageGroups.flatMap(({ pages }) => pages), ...aiCctvHiddenPages]
    .map((page) => [
      page.id,
      {
        ...page,
        path: routeByPageId[page.id],
        Component: page.Component || StandardPage,
      },
    ]),
);
