export default function Pagination({ page, pageCount, onChange }) {
  const hasPreviousPage = page > 1;
  const hasNextPage = page < pageCount;

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <div>
        {hasPreviousPage ? (
          <>
            <button
              type="button"
              className="pagination-arrow"
              aria-label="이전 페이지"
              onClick={() => onChange(page - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="pagination-number"
              aria-label={`${page - 1}페이지`}
              onClick={() => onChange(page - 1)}
            >
              {page - 1}
            </button>
          </>
        ) : (
          <>
            <span className="pagination-spacer" aria-hidden="true" />
            <span className="pagination-spacer" aria-hidden="true" />
          </>
        )}
        <span className="current" aria-current="page">
          {page}
        </span>
        {hasNextPage ? (
          <>
            <button
              type="button"
              className="pagination-number"
              aria-label={`${page + 1}페이지`}
              onClick={() => onChange(page + 1)}
            >
              {page + 1}
            </button>
            <button
              type="button"
              className="pagination-arrow"
              aria-label="다음 페이지"
              onClick={() => onChange(page + 1)}
            >
              ›
            </button>
          </>
        ) : (
          <>
            <span className="pagination-spacer" aria-hidden="true" />
            <span className="pagination-spacer" aria-hidden="true" />
          </>
        )}
      </div>
    </nav>
  );
}
