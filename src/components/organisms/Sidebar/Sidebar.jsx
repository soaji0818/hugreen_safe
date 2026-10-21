import { createElement as h } from "react";
import {
  CameraIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
} from "../../atoms/Icon/Icon";

const favoriteMenus = ["MES-TD3-007", "MES-TD3-017", "MES-TD3-008"];
const groupIcons = [ShieldIcon, CameraIcon, SettingsIcon];

function releaseMouseFocus(event) {
  if (event.pointerType === "mouse") event.currentTarget.blur();
}

export default function Sidebar({
  groups,
  current,
  itemMap,
  mobileOpen,
  menuQuery,
  openGroups,
  onMenuQueryChange,
  onToggleGroup,
  onNavigate,
}) {
  const favoriteItems = favoriteMenus
    .filter((id) => itemMap.get(id)?.includes(menuQuery))
    .map((id) => h(
      "button",
      {
        key: id,
        className: id === current ? "active" : "",
        "aria-current": id === current ? "page" : undefined,
        onPointerUp: releaseMouseFocus,
        onClick: () => onNavigate(id, false),
      },
      itemMap.get(id),
    ));

  const menuGroups = groups.map((group, index) => {
    const expanded = openGroups.includes(group.name) || Boolean(menuQuery);
    const menuItems = group.items
      .filter(([, label]) => label.includes(menuQuery))
      .map(([id, label]) => h(
        "button",
        {
          key: id,
          className: id === current ? "active" : "",
          "aria-current": id === current ? "page" : undefined,
          onPointerUp: releaseMouseFocus,
          onClick: () => onNavigate(id),
        },
        h("span", null, label),
      ));

    return h(
      "section",
      { key: group.name },
      h(
        "button",
        {
          className: "group",
          "aria-label": group.name,
          "aria-expanded": expanded,
          onPointerUp: releaseMouseFocus,
          onClick: () => onToggleGroup(group.name),
        },
        h(groupIcons[index] || SettingsIcon, { "aria-hidden": true }),
        h("strong", null, group.name),
        h("span", null, openGroups.includes(group.name) ? "⌄" : "›"),
      ),
      expanded ? h("div", { className: "nav-items" }, ...menuItems) : null,
    );
  });

  return h(
    "aside",
    { id: "sidebar-navigation", className: `sidebar ${mobileOpen ? "show" : ""}` },
    h(
      "div",
      { className: "nav-search" },
      h(SearchIcon, { "aria-hidden": true }),
      h("input", {
        "aria-label": "메뉴 검색",
        placeholder: "메뉴 검색",
        value: menuQuery,
        onChange: (event) => onMenuQueryChange(event.target.value),
      }),
    ),
    h("div", { className: "nav-caption favorite-caption" }, "자주 쓰는 메뉴"),
    h("nav", { className: "favorite-items", "aria-label": "자주 쓰는 메뉴" }, ...favoriteItems),
    h("div", { className: "nav-caption work-menu-caption" }, "업무 메뉴"),
    h("nav", { "aria-label": "주 메뉴" }, ...menuGroups),
  );
}
