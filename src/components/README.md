# Components

The component tree follows Atomic Design boundaries:

- `atoms`: indivisible controls and visual primitives
- `molecules`: small combinations with one focused interaction
- `organisms`: feature-level, data-aware UI sections
- `templates`: page-level layout composition
- `page/StandardPage.jsx`: shared page composition retained outside the Atomic Design layers

`templates/ContentTable`은 조회조건과 결과 영역을 한 열·두 행 그리드로 배치하고 공통 바깥 여백을 관리합니다. 첫 번째 자식은 `SearchConditions`, 두 번째 자식은 `DataTable`을 담은 결과 영역으로 둡니다. 조회조건 내부의 열 수는 계속 `SearchConditions.Row`에서 설정합니다.

```jsx
<ContentTable>
  <SearchConditions onReset={resetFilters}>...</SearchConditions>
  <section className="table-panel" aria-label="조회 결과">
    <DataTable columns={columns} rows={rows} />
  </section>
</ContentTable>
```

Search condition building blocks live in `molecules/SearchConditions` and are composed by `organisms/SearchConditions`. Use `SearchConditions.Row` to control how many condition molecules appear on each line. Direct children still form one automatically sized row when no row wrappers are used.

```jsx
<SearchConditions onReset={resetFilters}>
  <SearchConditions.Row columns={1}>
    <DateCondition startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
  </SearchConditions.Row>
  <SearchConditions.Row columns={3}>
    <RadioConditioin label="상태" options={statusOptions} value={status} onChange={setStatus} />
    <DropCondition label="공장" options={factoryOptions} value={factory} onChange={setFactory} />
    <DropCondition label="설비" options={deviceOptions} value={device} onChange={setDevice} />
  </SearchConditions.Row>
</SearchConditions>
```

`DataTable`의 `columns`는 기존 문자열 배열과 컬럼 설정 객체를 함께 사용할 수 있습니다. `width`에는 픽셀 숫자 또는 CSS 너비 문자열을 전달합니다.

```jsx
<DataTable
  columns={[
    { key: "cameraId", label: "카메라 ID", width: 140 },
    { key: "cameraName", label: "카메라명", width: 240 },
    { key: "status", label: "상태", width: 120 },
  ]}
  rows={rows}
  selectable={false}
/>
```

`renderCell`을 사용하면 두 번째 인자로 컬럼의 `key`가 전달됩니다. 헤더 크기 조절을 켠 경우 조절 핸들을 두 번 클릭하면 설정한 너비로 돌아갑니다.

`toolbarActions`에 전달한 `Button`은 크기를 지정하지 않으면 `small`로 표시됩니다. 개별 버튼에 `size`를 지정하면 해당 설정을 사용합니다.
