import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-slate-600 dark:text-[#A3A3A3]">
      <div className="flex items-center gap-2 text-xs">
        <span>
          Showing <span className="font-semibold text-slate-800 dark:text-[#F5F5F5]">{startItem}</span> to{" "}
          <span className="font-semibold text-slate-800 dark:text-[#F5F5F5]">{endItem}</span> of{" "}
          <span className="font-semibold text-slate-800 dark:text-[#F5F5F5]">{total}</span> entries
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 rounded-lg border border-slate-300 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] py-1 px-2.5 text-xs text-slate-700 dark:text-[#F5F5F5] focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-1.5 text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-50 dark:hover:bg-[#151515] dark:hover:text-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-[#F5F5F5]">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-1.5 text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-50 dark:hover:bg-[#151515] dark:hover:text-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
