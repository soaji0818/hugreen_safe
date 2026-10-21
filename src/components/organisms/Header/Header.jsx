/* oxlint-disable react/refs -- Refs are passed to React elements and read only inside the layout effect. */
import { createElement as h, useLayoutEffect, useRef } from "react";
import { CloseIcon, MenuIcon } from "../../atoms/Icon/Icon";

export default function Header({
  current,
  tabs,
  itemMap,
  user,
  sidebarCollapsed,
  mobileOpen,
  onToggleSidebar,
  onNavigate,
  onHome,
  onCloseTab,
  onLogout,
}) {
  const tabsElement = useRef(null);
  const tabIndicator = useRef(null);

  useLayoutEffect(() => {
    const tabList = tabsElement.current;
    const indicator = tabIndicator.current;
    if (!tabList || !indicator) return undefined;

    const moveIndicator = () => {
      const activeTab = tabList.querySelector(".tab.active");
      if (!activeTab) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.width = `${activeTab.offsetWidth}px`;
      indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      indicator.style.opacity = "1";
    };

    moveIndicator();
    const resizeObserver = new ResizeObserver(moveIndicator);
    resizeObserver.observe(tabList);
    return () => resizeObserver.disconnect();
  }, [current, tabs]);

  const tabItems = tabs.map((id) => h(
    "div",
    { className: current === id ? "tab active" : "tab", role: "presentation", key: id },
    h(
      "button",
      {
        role: "tab",
        "aria-selected": current === id,
        title: itemMap.get(id),
        onClick: () => onNavigate(id),
      },
      itemMap.get(id),
    ),
    h(
      "button",
      {
        className: "tab-close",
        "aria-label": `${itemMap.get(id)} 탭 닫기`,
        disabled: tabs.length === 1,
        onClick: () => onCloseTab(id),
      },
      h(CloseIcon, { size: 13, "aria-hidden": true }),
    ),
  ));

  return h(
    "header",
    { className: "topbar" },
    h(
      "div",
      { className: "header-leading" },
      h(
        "button",
        {
          className: "header-menu",
          "aria-label": sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기",
          "aria-controls": "sidebar-navigation",
          "aria-expanded": mobileOpen || !sidebarCollapsed,
          onClick: onToggleSidebar,
        },
        h(MenuIcon, { "aria-hidden": true }),
      ),
      h(
        "a",
        {
          className: "header-brand",
          href: "#",
          onClick: (event) => {
            event.preventDefault();
            onHome();
          },
        },
        h("img", {
          className: "header-brand-image",
          src: `${import.meta.env.BASE_URL}hugreen-logo.png`,
          alt: "휴그린 주식회사",
        }),
      ),
    ),
    h(
      "nav",
      { className: "tabs", role: "tablist", "aria-label": "열린 화면", ref: tabsElement },
      ...tabItems,
      h("span", { className: "top-tab-indicator", ref: tabIndicator, "aria-hidden": true }),
    ),
    h(
      "div",
      { className: "header-account", "aria-label": "사용자 계정" },
      h("span", { className: "header-user-name" }, user?.userNm || user?.userId),
      h("button", { type: "button", className: "header-logout", onClick: onLogout }, "로그아웃"),
    ),
  );
}
