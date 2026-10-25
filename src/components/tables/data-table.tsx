'use client';

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumnKey?: string;
  pageSize?: number;
  extraHeaderActions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchColumnKey,
  pageSize = 10,
  extraHeaderActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          {searchColumnKey ? (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchColumnKey)?.setFilterValue(event.target.value)
              }
              icon={<Search className="w-4 h-4" />}
            />
          ) : (
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          )}
        </div>
        {extraHeaderActions && (
          <div className="flex items-center gap-2">{extraHeaderActions}</div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-md transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-4 py-3.5 font-semibold select-none"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <div
                            className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/50 text-xs text-slate-600 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-1">
            <span>Showing</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}
            </span>
            <span>of</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{data.length}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-xs px-2 text-slate-700 dark:text-slate-300">
              Page{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {table.getState().pagination.pageIndex + 1}
              </span>{' '}
              of {Math.max(1, table.getPageCount())}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
