import { useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import Content from "../components/layout/Content";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const MAX_OPEN_TABS = 7;

export default function AppShell({ groups, pages, initialRows, user, onLogout }) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const page = Object.values(pages).find((item) => item.path === location.pathname) || null;
  const currentPageId = page?.id || null;
  const [openTabs, setOpenTabs] = useState(() => currentPageId ? [currentPageId] : []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);
  const [openGroups, setOpenGroups] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const allowNextNavigation = useRef(false);
  const items = groups.flatMap((group) => group.items);
  const itemMap = new Map([
    ...items,
    ...Object.values(pages).map(({ id, title }) => [id, title]),
  ]);
  const PageComponent = page?.Component;
  const viewVariants = page?.viewGroup
    ? Object.values(pages)
      .filter((item) => item.viewGroup === page.viewGroup)
      .sort((left, right) => (left.viewOrder || 0) - (right.viewOrder || 0))
    : [];
  const hasInlineDetail = Boolean(
    page?.config.detail
      && !["modal", "side-panel", "shrink-panel", "bottom-panel"].includes(page.config.detailPresentation)
      && !["log", "snap", "tree"].includes(page.config.detail),
  );
  const hasPageScrollDetail = page?.config.detailPresentation === "bottom-panel";
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    hasUnsavedChanges
      && !allowNextNavigation.current
      && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    allowNextNavigation.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/" || currentPageId) return;
    routerNavigate("/", { replace: true });
  }, [currentPageId, location.pathname, routerNavigate]);

  useEffect(() => {
    const preventUnsavedUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", preventUnsavedUnload);
    return () => window.removeEventListener("beforeunload", preventUnsavedUnload);
  }, [hasUnsavedChanges]);

  const requestLeave = (action) => {
    if (hasUnsavedChanges) {
      setPendingLeaveAction(() => action);
      return;
    }
    action();
  };

  const performNavigate = (pageId) => {
    if (!pages[pageId]) return;
    setOpenTabs((tabs) => {
      if (tabs.includes(pageId)) return tabs;
      if (tabs.length < MAX_OPEN_TABS) return [...tabs, pageId];
      const removableIndex = tabs.findIndex((tabId) => tabId !== currentPageId);
      return [...tabs.filter((_, index) => index !== removableIndex), pageId];
    });
    allowNextNavigation.current = true;
    routerNavigate(pages[pageId].path);
  };
  const navigateToPage = (pageId) => {
    if (pageId === currentPageId || pageId === page?.menuId) return;
    requestLeave(() => performNavigate(pageId));
  };
  const switchPageVariant = (pageId) => {
    if (pageId === currentPageId || !pages[pageId]) return;
    requestLeave(() => {
      setOpenTabs((tabs) => {
        const nextTabs = tabs.includes(currentPageId)
          ? tabs.map((tabId) => tabId === currentPageId ? pageId : tabId)
          : [...tabs, pageId];
        return [...new Set(nextTabs)];
      });
      allowNextNavigation.current = true;
      routerNavigate(pages[pageId].path);
    });
  };
  const navigateFromLayout = (pageId, expandMenu = true) => {
    navigateToPage(pageId);
    if (expandMenu) {
      const owner = groups.find((group) =>
        group.items.some(([itemId]) => itemId === pageId),
      );
      if (owner) {
        setOpenGroups((currentGroups) => [
          ...new Set([...currentGroups, owner.name]),
        ]);
      }
    }
    setMobileOpen(false);
  };
  const navigateHome = () => {
    if (currentPageId === null) return;
    requestLeave(() => {
      allowNextNavigation.current = true;
      routerNavigate("/");
    });
  };

  const performCloseTab = (pageId) => {
    if (openTabs.length === 1) return;
    const nextTabs = openTabs.filter((tabId) => tabId !== pageId);
    setOpenTabs(nextTabs);
    if (currentPageId === pageId) {
      allowNextNavigation.current = true;
      routerNavigate(pages[nextTabs.at(-1)].path);
    }
  };
  const closeTab = (pageId) => {
    if (pageId === currentPageId) {
      requestLeave(() => performCloseTab(pageId));
      return;
    }
    performCloseTab(pageId);
  };

  const confirmLeave = () => {
    const action = pendingLeaveAction;
    setPendingLeaveAction(null);
    setHasUnsavedChanges(false);
    if (action) {
      action();
    } else if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };
  const cancelLeave = () => {
    setPendingLeaveAction(null);
    if (blocker.state === "blocked") blocker.reset();
  };
  const toggleGroup = (groupName) => {
    setOpenGroups((currentGroups) =>
      currentGroups.includes(groupName)
        ? currentGroups.filter((name) => name !== groupName)
        : [...currentGroups, groupName],
    );
  };
  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 800px)").matches) {
      setMobileOpen(true);
    } else {
      setSidebarCollapsed((value) => !value);
    }
  };
  const navigateHomeFromLayout = () => {
    navigateHome();
    setMobileOpen(false);
  };

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip" href="#main">본문으로 이동</a>
      <Sidebar
        groups={groups}
        current={page?.menuId || currentPageId}
        itemMap={itemMap}
        mobileOpen={mobileOpen}
        menuQuery={menuQuery}
        openGroups={openGroups}
        onMenuQueryChange={setMenuQuery}
        onToggleGroup={toggleGroup}
        onNavigate={navigateFromLayout}
      />
      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        />
      )}
      <div className="workspace">
        <Header
          current={currentPageId}
          tabs={openTabs}
          itemMap={itemMap}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggleSidebar={toggleSidebar}
          onNavigate={navigateFromLayout}
          onHome={navigateHomeFromLayout}
          onCloseTab={closeTab}
          onLogout={() => requestLeave(onLogout)}
        />
        <Content
          title={page?.title || "스마트 안전관리 시스템"}
          titleActions={viewVariants.length > 1 ? (
            <div className="workspace-view-switch" role="group" aria-label="상세 표시 방식">
              {viewVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={variant.id === currentPageId ? "active" : ""}
                  aria-pressed={variant.id === currentPageId}
                  onClick={() => switchPageVariant(variant.id)}
                >
                  {variant.viewLabel}
                </button>
              ))}
            </div>
          ) : null}
          mainClassName={[
            hasInlineDetail ? "has-inline-detail" : "",
            hasPageScrollDetail ? "has-page-scroll-detail" : "",
          ].filter(Boolean).join(" ")}
        >
          {PageComponent ? (
            <PageComponent
              key={currentPageId}
              pageDefinition={page}
              initialRows={initialRows}
              user={user}
              onUnauthorized={onLogout}
              onUnsavedChange={setHasUnsavedChanges}
            />
          ) : (
            <section className="home-welcome" aria-label="휴그린 스마트 안전관리 시스템">
              <div className="home-welcome-content">
                <img src={`${import.meta.env.BASE_URL}hugreen-logo.png`} alt="휴그린 주식회사" />
                <p>좌측 사이드바에서 메뉴를 선택해 주세요.</p>
              </div>
            </section>
          )}
          <ConfirmDialog
            open={Boolean(pendingLeaveAction) || blocker.state === "blocked"}
            title="저장되지 않은 내용이 있습니다."
            description="저장하지 않고 나가시겠습니까?"
            confirmLabel="나가기"
            onCancel={cancelLeave}
            onConfirm={confirmLeave}
          />
        </Content>
      </div>
    </div>
  );
}
