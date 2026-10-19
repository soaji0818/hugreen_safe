import { useLayoutEffect, useRef, useState } from "react";
import Icon from "../ui/Icon";

const favoriteMenus = ["MES-TD3-007", "MES-TD3-017", "MES-TD3-008"];

export default function AdminLayout({
  groups,
  items,
  current,
  tabs,
  title,
  user,
  mainClassName = "",
  onNavigate,
  onHome,
  onCloseTab,
  onLogout,
  children,
}) {
  const [openGroups, setOpenGroups] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const tabsElement = useRef(null);
  const tabIndicator = useRef(null);
  const itemMap = new Map(items.map(([id, label]) => [id, label]));

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

  const navigate = (id, expandMenu = true) => {
    onNavigate(id, expandMenu);
    if (expandMenu) {
      const owner = groups.find((group) =>
        group.items.some(([itemId]) => itemId === id),
      );
      if (owner) {
        setOpenGroups((currentGroups) => [
          ...new Set([...currentGroups, owner.name]),
        ]);
      }
    }
    setMobileOpen(false);
  };

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip" href="#main">본문으로 이동</a>
      <aside
        id="sidebar-navigation"
        className={`sidebar ${mobileOpen ? "show" : ""}`}
      >
        <div className="nav-search">
          <Icon name="search" />
          <input
            aria-label="메뉴 검색"
            placeholder="메뉴 검색"
            value={menuQuery}
            onChange={(event) => setMenuQuery(event.target.value)}
          />
        </div>
        <div className="nav-caption favorite-caption">자주 쓰는 메뉴</div>
        <nav className="favorite-items" aria-label="자주 쓰는 메뉴">
          {favoriteMenus
            .filter((id) => itemMap.get(id)?.includes(menuQuery))
            .map((id) => (
              <button
                key={id}
                className={id === current ? "active" : ""}
                aria-current={id === current ? "page" : undefined}
                onClick={() => navigate(id, false)}
              >
                {itemMap.get(id)}
              </button>
            ))}
        </nav>
        <div className="nav-caption work-menu-caption">업무 메뉴</div>
        <nav aria-label="주 메뉴">
          {groups.map((group, index) => (
            <section key={group.name}>
              <button
                className="group"
                aria-label={group.name}
                aria-expanded={openGroups.includes(group.name) || Boolean(menuQuery)}
                onClick={() => setOpenGroups((currentGroups) =>
                  currentGroups.includes(group.name)
                    ? currentGroups.filter((name) => name !== group.name)
                    : [...currentGroups, group.name]
                )}
              >
                <Icon name={["shield", "camera", "settings"][index]} />
                <strong>{group.name}</strong>
                <span>{openGroups.includes(group.name) ? "⌄" : "›"}</span>
              </button>
              {(openGroups.includes(group.name) || menuQuery) && (
                <div className="nav-items">
                  {group.items
                    .filter(([, label]) => label.includes(menuQuery))
                    .map(([id, label]) => (
                      <button
                        key={id}
                        className={id === current ? "active" : ""}
                        aria-current={id === current ? "page" : undefined}
                        onClick={() => navigate(id)}
                      >
                        <span>{label}</span>
                      </button>
                    ))}
                </div>
              )}
            </section>
          ))}
        </nav>
      </aside>
      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="header-leading">
            <button
              className="header-menu"
              aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
              aria-controls="sidebar-navigation"
              aria-expanded={mobileOpen || !sidebarCollapsed}
              onClick={() => {
                if (window.matchMedia("(max-width: 800px)").matches) {
                  setMobileOpen(true);
                } else {
                  setSidebarCollapsed((value) => !value);
                }
              }}
            >
              <Icon name="menu" />
            </button>
            <a
              className="header-brand"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onHome();
                setMobileOpen(false);
              }}
            >
              <img
                className="header-brand-image"
                src="/hugreen-logo.png"
                alt="휴그린 주식회사"
              />
            </a>
          </div>
          <nav
            className="tabs"
            role="tablist"
            aria-label="열린 화면"
            ref={tabsElement}
          >
            {tabs.map((id) => (
              <div
                className={current === id ? "tab active" : "tab"}
                role="presentation"
                key={id}
              >
                <button
                  role="tab"
                  aria-selected={current === id}
                  title={itemMap.get(id)}
                  onClick={() => navigate(id)}
                >
                  {itemMap.get(id)}
                </button>
                <button
                  className="tab-close"
                  aria-label={`${itemMap.get(id)} 탭 닫기`}
                  disabled={tabs.length === 1}
                  onClick={() => onCloseTab(id)}
                >
                  <Icon name="close" size={13} />
                </button>
              </div>
            ))}
            <span
              className="top-tab-indicator"
              ref={tabIndicator}
              aria-hidden="true"
            />
          </nav>
          <div className="header-account" aria-label="사용자 계정">
            <span className="header-user-name">{user?.userNm || user?.userId}</span>
            <button type="button" className="header-logout" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </header>
        <div className="workspace-title"><h1>{title}</h1></div>
        <main id="main" className={mainClassName}>{children}</main>
      </div>
    </div>
  );
}
