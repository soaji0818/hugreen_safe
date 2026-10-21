# Components

The component tree follows Atomic Design boundaries:

- `atoms`: indivisible controls and visual primitives
- `molecules`: small combinations with one focused interaction
- `organisms`: feature-level, data-aware UI sections
- `templates`: page-level layout composition
- `page/StandardPage.jsx`: shared page composition retained outside the Atomic Design layers

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
