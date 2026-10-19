import { useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
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
  const allowNextNavigation = useRef(false);
  const items = groups.flatMap((group) => group.items);
  const PageComponent = page?.Component;
  const hasInlineDetail = Boolean(
    page?.config.detail
      && page.config.detailPresentation !== "modal"
      && !["log", "snap", "tree"].includes(page.config.detail),
  );
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
    if (pageId === currentPageId) return;
    requestLeave(() => performNavigate(pageId));
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

  return (
    <AdminLayout
      groups={groups}
      items={items}
      current={currentPageId}
      tabs={openTabs}
      title={page?.title || "스마트 안전관리 시스템"}
      user={user}
      mainClassName={hasInlineDetail ? "has-inline-detail" : ""}
      onNavigate={navigateToPage}
      onHome={navigateHome}
      onCloseTab={closeTab}
      onLogout={() => requestLeave(onLogout)}
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
    </AdminLayout>
  );
}
