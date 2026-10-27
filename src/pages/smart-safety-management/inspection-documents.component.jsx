import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import { PlusIcon } from "../../components/atoms/Icon/Icon";
import ConfirmDialog from "../../components/molecules/ConfirmDialog/ConfirmDialog";
import Toast from "../../components/molecules/Toast/Toast";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
import useCommonCodes from "../../hooks/useCommonCodes";
import {
  deleteCheckDocument,
  deleteCheckItem,
  deleteCheckSection,
  fetchCheckDocuments,
  fetchCheckItems,
  fetchCheckSections,
  saveCheckDocument,
  saveCheckItem,
  saveCheckSection,
} from "../../api/inspectionDocumentApi";
import "./inspection-documents.css";

function nextNumber(rows, key) {
  return String(Math.max(0, ...rows.map((row) => Number(row[key]) || 0)) + 1);
}

function sameCode(left, right) {
  return String(left) === String(right);
}

function nextSort(rows) {
  return Math.min(9999, Math.max(0, ...rows.map((row) => Number(row.sortNo) || 0)) + 1);
}

function editorForDocument(document) {
  const values = document
    ? { docCd: document.docCd || "", docNm: document.docNm || "", equipCd: document.equipCd || "", cycleCd: document.cycleCd || "", useYn: document.useYn || "Y" }
    : { docCd: "", docNm: "", equipCd: "", cycleCd: "", useYn: "Y" };
  return { kind: "document", isNew: !document, values, baseline: values };
}

function editorForSection(document, section, sections) {
  const values = section
    ? { secNo: section.secNo || "", secNm: section.secNm || "", sortNo: section.sortNo ?? 0 }
    : { secNo: nextNumber(sections, "secNo"), secNm: "", sortNo: nextSort(sections) };
  return { kind: "section", isNew: !section, docCd: document.docCd, values, baseline: values };
}

function editorForItem(document, section, item, items) {
  const sectionItems = items.filter((candidate) => sameCode(candidate.secNo, section.secNo));
  const values = item
    ? { itemNo: item.itemNo || "", itemNm: item.itemNm || "", criteria: item.criteria || "", inputMtdCd: item.inputMtdCd || "", sortNo: item.sortNo ?? 0, useYn: item.useYn || "Y" }
    : { itemNo: nextNumber(sectionItems, "itemNo"), itemNm: "", criteria: "", inputMtdCd: "", sortNo: nextSort(sectionItems), useYn: "Y" };
  return { kind: "item", isNew: !item, docCd: document.docCd, secNo: section.secNo, values, baseline: values };
}

function sortRows(rows) {
  return [...rows].sort((a, b) => (Number(a.sortNo) || 0) - (Number(b.sortNo) || 0)
    || String(a.secNo || a.itemNo).localeCompare(String(b.secNo || b.itemNo), undefined, { numeric: true }));
}

function CodeInput({ value, options, onChange, placeholder, required = false }) {
  if (!options.length) {
    return <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={20} placeholder={placeholder} required={required} />;
  }
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
      <option value="">선택</option>
      {value && !options.some((option) => option.value === value) && <option value={value}>{value}</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

export default function InspectionDocumentsPage({ user, onUnauthorized, onUnsavedChange }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocCd, setSelectedDocCd] = useState("");
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [documentsVersion, setDocumentsVersion] = useState(0);
  const [detailVersion, setDetailVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [useFilter, setUseFilter] = useState("");
  const [collapsedSections, setCollapsedSections] = useState([]);
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const { data: cycles } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "CHK_CYCLE", onUnauthorized });
  const { data: inputMethods } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "JUDGE_MTD", onUnauthorized });
  const cycleNames = useMemo(() => new Map(cycles.map((code) => [code.value, code.label])), [cycles]);
  const inputNames = useMemo(() => new Map(inputMethods.map((code) => [code.value, code.label])), [inputMethods]);
  const selectedDocument = documents.find((document) => sameCode(document.docCd, selectedDocCd)) || null;
  const visibleDocuments = documents.filter((document) => {
    const matchUse = !useFilter || document.useYn === useFilter;
    const keyword = search.trim().toLowerCase();
    const matchSearch = !keyword || [document.docCd, document.docNm, document.equipCd].some((value) => String(value || "").toLowerCase().includes(keyword));
    return matchUse && matchSearch;
  });
  const sortedSections = useMemo(() => sortRows(sections), [sections]);
  const dirty = Boolean(editor) && JSON.stringify(editor.values) !== JSON.stringify(editor.baseline);

  useEffect(() => {
    onUnsavedChange?.(dirty || saving || deleting);
    return () => onUnsavedChange?.(false);
  }, [dirty, saving, deleting, onUnsavedChange]);

  useEffect(() => {
    if (!user?.token) return undefined;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect
    setDocumentsLoading(true);
    setDocumentsError("");
    fetchCheckDocuments({ token: user.token, signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const nextDocuments = payload.data || [];
        setDocuments(nextDocuments);
        setSelectedDocCd((current) => nextDocuments.some((document) => sameCode(document.docCd, current))
          ? current : nextDocuments[0]?.docCd || "");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (error.status === 401) onUnauthorized?.();
        else setDocumentsError(error.message);
      })
      .finally(() => { if (!controller.signal.aborted) setDocumentsLoading(false); });
    return () => controller.abort();
  }, [user?.token, onUnauthorized, documentsVersion]);

  useEffect(() => {
    if (!user?.token || !selectedDocCd) return undefined;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect
    setDetailLoading(true);
    setDetailError("");
    setSections([]);
    setItems([]);
    Promise.all([
      fetchCheckSections({ token: user.token, docCd: selectedDocCd, signal: controller.signal }),
      fetchCheckItems({ token: user.token, docCd: selectedDocCd, signal: controller.signal }),
    ])
      .then(([sectionPayload, itemPayload]) => {
        if (controller.signal.aborted) return;
        setSections(sectionPayload.data || []);
        setItems(itemPayload.data || []);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (error.status === 401) onUnauthorized?.();
        else {
          setSections([]);
          setItems([]);
          setDetailError(error.message);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [user?.token, selectedDocCd, onUnauthorized, detailVersion]);

  function openEditor(nextEditor) {
    setEditorError("");
    setEditor(nextEditor);
  }

  function updateEditor(key, value) {
    setEditor((current) => ({ ...current, values: { ...current.values, [key]: value } }));
    setEditorError("");
  }

  function closeEditor() {
    if (saving) return;
    if (dirty) setLeaveConfirmOpen(true);
    else setEditor(null);
  }

  function discardEditor() {
    setLeaveConfirmOpen(false);
    setEditor(null);
    setEditorError("");
  }

  async function submitEditor(event) {
    event.preventDefault();
    if (!editor || saving) return;
    const values = editor.values;
    const code = String(values.docCd || values.secNo || values.itemNo || "").trim();
    const name = String(values.docNm || values.secNm || values.itemNm || "").trim();
    if (!code || !name) {
      setEditorError("코드(번호)와 이름을 입력해 주세요.");
      return;
    }
    if (editor.kind === "document" && !values.cycleCd) {
      setEditorError("점검 주기를 입력해 주세요.");
      return;
    }
    if (editor.kind === "item" && !values.inputMtdCd) {
      setEditorError("입력 방식을 선택해 주세요.");
      return;
    }
    const sortNo = Number(values.sortNo);
    if (editor.kind !== "document" && (!Number.isInteger(sortNo) || sortNo < 0 || sortNo > 9999)) {
      setEditorError("표시 순서는 0부터 9999 사이의 정수로 입력해 주세요.");
      return;
    }
    setSaving(true);
    setEditorError("");
    try {
      if (editor.kind === "document") {
        await saveCheckDocument({
          token: user.token,
          docCd: code,
          data: { docNm: name, equipCd: values.equipCd.trim() || null, cycleCd: values.cycleCd, useYn: values.useYn },
        });
        setSelectedDocCd(code);
        setDocumentsVersion((version) => version + 1);
        setDetailVersion((version) => version + 1);
      } else if (editor.kind === "section") {
        await saveCheckSection({
          token: user.token, docCd: editor.docCd, secNo: code,
          data: { secNm: name, sortNo },
        });
        setDetailVersion((version) => version + 1);
      } else {
        await saveCheckItem({
          token: user.token, docCd: editor.docCd, secNo: editor.secNo, itemNo: code,
          data: { itemNm: name, criteria: values.criteria.trim() || null, inputMtdCd: values.inputMtdCd, sortNo, useYn: values.useYn },
        });
        setDetailVersion((version) => version + 1);
        setDocumentsVersion((version) => version + 1);
      }
      setEditor(null);
      setNotice(`${editor.kind === "document" ? "점검 문서" : editor.kind === "section" ? "목차" : "점검 항목"}를 저장했습니다.`);
    } catch (error) {
      if (error.status === 401) onUnauthorized?.();
      else setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      let payload;
      if (deleteTarget.kind === "document") {
        payload = await deleteCheckDocument({ token: user.token, docCd: deleteTarget.docCd });
        setDocumentsVersion((version) => version + 1);
        setDetailVersion((version) => version + 1);
      } else if (deleteTarget.kind === "section") {
        payload = await deleteCheckSection({ token: user.token, docCd: deleteTarget.docCd, secNo: deleteTarget.secNo });
        setDetailVersion((version) => version + 1);
      } else {
        payload = await deleteCheckItem({ token: user.token, docCd: deleteTarget.docCd, secNo: deleteTarget.secNo, itemNo: deleteTarget.itemNo });
        setDetailVersion((version) => version + 1);
        setDocumentsVersion((version) => version + 1);
      }
      setNotice(payload.resultMsg || (payload.resultCd === 1 ? "점검 이력이 있어 사용중지로 변경했습니다." : "삭제했습니다."));
      setDeleteTarget(null);
    } catch (error) {
      if (error.status === 401) onUnauthorized?.();
      else {
        setNotice(error.message);
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="work-panel check-doc-page" aria-label="점검 문서·목차 관리">
      <div className="check-doc-layout">
        <aside className="check-doc-list" aria-label="점검 문서 목록">
          <div className="check-doc-list__heading">
            <div><h2>점검 문서</h2><span>{documentsLoading ? "조회 중" : `${documents.length}개`}</span></div>
            <Button size="small" icon={PlusIcon} onClick={() => openEditor(editorForDocument(null))}>문서 추가</Button>
          </div>
          <div className="check-doc-list__filters">
            <input aria-label="점검 문서 검색" placeholder="문서명·코드·설비 검색" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select aria-label="사용 여부 필터" value={useFilter} onChange={(event) => setUseFilter(event.target.value)}>
              <option value="">전체</option><option value="Y">사용</option><option value="N">미사용</option>
            </select>
          </div>
          {documentsError && <div className="check-doc-state is-error" role="alert">{documentsError}<Button size="small" variant="weak" onClick={() => setDocumentsVersion((version) => version + 1)}>다시 시도</Button></div>}
          {!documentsError && (
            <div className="check-doc-list__items">
              {visibleDocuments.map((document) => (
                <button key={document.docCd} type="button" className={sameCode(document.docCd, selectedDocCd) ? "is-selected" : ""} aria-current={sameCode(document.docCd, selectedDocCd) ? "true" : undefined} onClick={() => { setSelectedDocCd(document.docCd); setCollapsedSections([]); }}>
                  <span className="check-doc-list__item-title">{document.docNm || document.docCd}</span>
                  <span className="check-doc-list__item-meta">{document.docCd} · {cycleNames.get(document.cycleCd) || document.cycleCd || "주기 미지정"}</span>
                  <span className="check-doc-list__item-foot">{document.equipCd || "공통 설비"}<em className={document.useYn === "N" ? "is-off" : ""}>{document.useYn === "N" ? "미사용" : "사용"}</em></span>
                </button>
              ))}
              {!documentsLoading && visibleDocuments.length === 0 && <p className="check-doc-state">표시할 점검 문서가 없습니다.</p>}
            </div>
          )}
        </aside>

        <div className="check-doc-detail">
          {!selectedDocument ? (
            <div className="check-doc-detail__empty">{documentsLoading ? "점검 문서를 불러오는 중입니다." : "왼쪽에서 점검 문서를 선택하거나 새 문서를 추가해 주세요."}</div>
          ) : (
            <>
              <header className="check-doc-detail__heading">
                <div>
                  <p>{selectedDocument.docCd}</p>
                  <h2>{selectedDocument.docNm || selectedDocument.docCd}</h2>
                </div>
                <div className="check-doc-actions">
                  <Button size="small" variant="weak" onClick={() => openEditor(editorForDocument(selectedDocument))}>문서 수정</Button>
                  <Button size="small" variant="weak" className="check-doc-danger" onClick={() => setDeleteTarget({ kind: "document", docCd: selectedDocument.docCd, name: selectedDocument.docNm })}>문서 삭제</Button>
                </div>
              </header>
              <dl className="check-doc-summary">
                <div><dt>대상 설비</dt><dd>{selectedDocument.equipCd || "공통"}</dd></div>
                <div><dt>점검 주기</dt><dd>{cycleNames.get(selectedDocument.cycleCd) || selectedDocument.cycleCd || "-"}</dd></div>
                <div><dt>사용 여부</dt><dd><Badge tone={selectedDocument.useYn === "N" ? "gray" : "green"}>{selectedDocument.useYn === "N" ? "미사용" : "사용"}</Badge></dd></div>
                <div><dt>사용 항목</dt><dd>{selectedDocument.itemCnt ?? items.filter((item) => item.useYn !== "N").length}개</dd></div>
              </dl>

              <div className="check-doc-detail__section-heading">
                <div><h3>목차와 점검 항목</h3><span>{detailLoading ? "조회 중" : `목차 ${sections.length}개 · 항목 ${items.length}개`}</span></div>
                <Button size="small" variant="weak" icon={PlusIcon} onClick={() => openEditor(editorForSection(selectedDocument, null, sections))}>목차 추가</Button>
              </div>
              {detailError && <div className="check-doc-state is-error" role="alert">{detailError}<Button size="small" variant="weak" onClick={() => setDetailVersion((version) => version + 1)}>다시 시도</Button></div>}
              {!detailLoading && !detailError && sortedSections.map((section) => {
                const sectionItems = sortRows(items.filter((item) => sameCode(item.secNo, section.secNo)));
                const collapsed = collapsedSections.includes(section.secNo);
                return (
                  <article key={section.secNo} className="check-doc-section">
                    <header>
                      <button type="button" className="check-doc-section__toggle" aria-expanded={!collapsed} onClick={() => setCollapsedSections((current) => collapsed ? current.filter((id) => id !== section.secNo) : [...current, section.secNo])}>
                        <span aria-hidden="true">{collapsed ? "›" : "⌄"}</span>
                        <strong>{section.secNm || section.secNo}</strong>
                        <small>{sectionItems.length}개 항목</small>
                      </button>
                      <div className="check-doc-actions">
                        <Button size="small" variant="text" onClick={() => openEditor(editorForItem(selectedDocument, section, null, items))}>항목 추가</Button>
                        <Button size="small" variant="text" onClick={() => openEditor(editorForSection(selectedDocument, section, sections))}>수정</Button>
                        <Button size="small" variant="text" className="check-doc-danger" onClick={() => setDeleteTarget({ kind: "section", docCd: selectedDocument.docCd, secNo: section.secNo, name: section.secNm })}>삭제</Button>
                      </div>
                    </header>
                    {!collapsed && (
                      sectionItems.length ? <div className="check-doc-section__table-wrap"><table>
                        <thead><tr><th>점검 항목</th><th>점검 기준</th><th>입력 방식</th><th>상태</th><th>관리</th></tr></thead>
                        <tbody>{sectionItems.map((item) => (
                          <tr key={item.itemNo}>
                            <td><span className="check-doc-item-number">{item.itemNo}</span><strong>{item.itemNm || "-"}</strong></td>
                            <td>{item.criteria || "-"}</td>
                            <td>{inputNames.get(item.inputMtdCd) || item.inputMtdCd || "-"}</td>
                            <td><Badge tone={item.useYn === "N" ? "gray" : "green"}>{item.useYn === "N" ? "미사용" : "사용"}</Badge></td>
                            <td><div className="check-doc-actions"><Button size="small" variant="text" onClick={() => openEditor(editorForItem(selectedDocument, section, item, items))}>수정</Button><Button size="small" variant="text" className="check-doc-danger" onClick={() => setDeleteTarget({ kind: "item", docCd: selectedDocument.docCd, secNo: section.secNo, itemNo: item.itemNo, name: item.itemNm, usedYn: item.usedYn })}>{item.usedYn === "Y" ? "사용중지" : "삭제"}</Button></div></td>
                          </tr>
                        ))}</tbody>
                      </table></div> : <p className="check-doc-section__empty">등록된 점검 항목이 없습니다. 항목을 추가해 주세요.</p>
                    )}
                  </article>
                );
              })}
              {!detailLoading && !detailError && sections.length === 0 && <p className="check-doc-detail__empty is-small">목차가 없습니다. 점검 문서의 첫 목차를 추가해 주세요.</p>}
            </>
          )}
        </div>
      </div>

      <CrudModal open={Boolean(editor)} mode={editor?.isNew ? "create" : "edit"} titles={{ create: editor?.kind === "document" ? "점검 문서 추가" : editor?.kind === "section" ? "목차 추가" : "점검 항목 추가", edit: editor?.kind === "document" ? "점검 문서 수정" : editor?.kind === "section" ? "목차 수정" : "점검 항목 수정" }} formId="check-doc-editor-form" className="check-doc-dialog" saving={saving} onClose={closeEditor} onSubmit={submitEditor}>
        {editor && <div className="check-doc-form">
          {editor.kind === "document" && <>
            <label>문서 코드<input value={editor.values.docCd} maxLength={20} disabled={!editor.isNew || saving} onChange={(event) => updateEditor("docCd", event.target.value)} required /></label>
            <label>문서명<input value={editor.values.docNm} maxLength={100} disabled={saving} onChange={(event) => updateEditor("docNm", event.target.value)} required /></label>
            <label>대상 설비 코드<input value={editor.values.equipCd} maxLength={20} disabled={saving} onChange={(event) => updateEditor("equipCd", event.target.value)} placeholder="공통 문서는 비워 두세요" /></label>
            <label>점검 주기<CodeInput value={editor.values.cycleCd} options={cycles} onChange={(value) => updateEditor("cycleCd", value)} placeholder="주기 코드" required /></label>
            <label>사용 여부<select value={editor.values.useYn} disabled={saving} onChange={(event) => updateEditor("useYn", event.target.value)}><option value="Y">사용</option><option value="N">미사용</option></select></label>
          </>}
          {editor.kind === "section" && <>
            <label>목차 번호<input value={editor.values.secNo} maxLength={10} disabled={!editor.isNew || saving} onChange={(event) => updateEditor("secNo", event.target.value)} required /></label>
            <label>목차명<input value={editor.values.secNm} maxLength={100} disabled={saving} onChange={(event) => updateEditor("secNm", event.target.value)} required /></label>
            <label>표시 순서<input type="number" value={editor.values.sortNo} min={0} max={9999} disabled={saving} onChange={(event) => updateEditor("sortNo", event.target.value)} required /></label>
          </>}
          {editor.kind === "item" && <>
            <label>항목 번호<input value={editor.values.itemNo} maxLength={10} disabled={!editor.isNew || saving} onChange={(event) => updateEditor("itemNo", event.target.value)} required /></label>
            <label>항목명<input value={editor.values.itemNm} maxLength={200} disabled={saving} onChange={(event) => updateEditor("itemNm", event.target.value)} required /></label>
            <label>점검 기준<textarea value={editor.values.criteria} maxLength={500} disabled={saving} onChange={(event) => updateEditor("criteria", event.target.value)} /></label>
            <label>입력 방식<CodeInput value={editor.values.inputMtdCd} options={inputMethods} onChange={(value) => updateEditor("inputMtdCd", value)} placeholder="입력 방식 코드" required /></label>
            <label>표시 순서<input type="number" value={editor.values.sortNo} min={0} max={9999} disabled={saving} onChange={(event) => updateEditor("sortNo", event.target.value)} required /></label>
            <label>사용 여부<select value={editor.values.useYn} disabled={saving} onChange={(event) => updateEditor("useYn", event.target.value)}><option value="Y">사용</option><option value="N">미사용</option></select></label>
          </>}
          {editorError && <p className="check-doc-form__error" role="alert">{editorError}</p>}
        </div>}
      </CrudModal>
      <ConfirmDialog open={Boolean(deleteTarget)} title={deleteTarget?.usedYn === "Y" ? "점검 항목을 사용중지하시겠습니까?" : `${deleteTarget?.name || "선택한 항목"}을(를) 삭제하시겠습니까?`} description={deleteTarget?.kind === "document" || deleteTarget?.kind === "item" ? "점검 이력이 있으면 삭제 대신 사용중지됩니다." : "목차에 항목이 있으면 삭제할 수 없을 수 있습니다."} confirmLabel={deleteTarget?.usedYn === "Y" ? "사용중지" : "삭제"} confirmDisabled={deleting} cancelDisabled={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      <ConfirmDialog open={leaveConfirmOpen} title="저장되지 않은 내용이 있습니다." description="변경 내용을 버리고 닫으시겠습니까?" confirmLabel="버리고 닫기" onCancel={() => setLeaveConfirmOpen(false)} onConfirm={discardEditor} />
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
