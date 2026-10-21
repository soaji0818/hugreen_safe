import { useMemo, useState } from "react";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import StandardPage from "../../components/page/StandardPage";
import "./cctv-event-ingestion.css";

const INITIAL_FILTERS = {
  startDate: "2026-10-01",
  endDate: "2026-10-08",
  period: "week",
  camera: "",
  eventType: "",
  status: "",
};

const STATUS_OPTIONS = [
  { value: "미확인", label: "미확인" },
  { value: "확인", label: "확인" },
  { value: "조치중", label: "조치중" },
  { value: "조치완료", label: "조치완료" },
  { value: "스팸 종료", label: "스팸 종료" },
];

function dateValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getRange(period, endDate) {
  const daysByPeriod = {
    today: 1,
    week: 7,
    month: 30,
    threeMonths: 90,
    sixMonths: 180,
  };
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (daysByPeriod[period] || 7));
  return { startDate: dateValue(start), endDate: dateValue(end), period };
}

export default function CctvEventIngestionPage({ pageDefinition, initialRows = [], ...pageProps }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const cameraOptions = useMemo(() => [
    ...new Set(initialRows.map((_, index) => `CAM-${String(index + 1).padStart(2, "0")}`)),
  ].map((value) => ({ value, label: value })), [initialRows]);
  const eventTypeOptions = useMemo(() => [
    ...new Set(initialRows.map((row) => row.type).filter(Boolean)),
  ].map((value) => ({ value, label: value })), [initialRows]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const updateDate = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, period: "" }));
  };
  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const pageWithoutBuiltInFilters = {
    ...pageDefinition,
    config: { ...pageDefinition.config, filters: [] },
  };

  return (
    <div className="cctv-event-ingestion-page">
      <SearchConditions onReset={resetFilters}>
        <DateCondition
          startDate={filters.startDate}
          endDate={filters.endDate}
          period={filters.period}
          onStartDateChange={(value) => updateDate("startDate", value)}
          onEndDateChange={(value) => updateDate("endDate", value)}
          onPeriodChange={(period) => setFilters((current) => ({
            ...current,
            ...getRange(period, current.endDate || current.startDate || dateValue(new Date())),
          }))}
        />
        <DropCondition
          label="카메라"
          value={filters.camera}
          placeholder="전체 카메라"
          options={cameraOptions}
          onChange={(value) => updateFilter("camera", value)}
        />
        <DropCondition
          label="이벤트 유형"
          value={filters.eventType}
          placeholder="전체 이벤트 유형"
          options={eventTypeOptions}
          onChange={(value) => updateFilter("eventType", value)}
        />
        <DropCondition
          label="확인 상태"
          value={filters.status}
          placeholder="전체 확인 상태"
          options={STATUS_OPTIONS}
          onChange={(value) => updateFilter("status", value)}
        />
      </SearchConditions>
      <StandardPage
        {...pageProps}
        pageDefinition={pageWithoutBuiltInFilters}
        initialRows={initialRows}
      />
    </div>
  );
}
