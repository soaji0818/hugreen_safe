import { aiCctvPages } from "./ai-cctv-management";
import { smartSafetyPages } from "./smart-safety-management";
import { systemManagementPages } from "./system-management";
import StandardPage from "../components/page/StandardPage";

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
  pageGroups.flatMap(({ pages }) =>
    pages.map((page) => [
      page.id,
      { ...page, Component: page.Component || StandardPage },
    ]),
  ),
);
