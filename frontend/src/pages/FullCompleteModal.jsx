import React, { useState, useMemo } from "react";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const PAGE_SIZE = 20;

export default function FullCompleteModal({ completes, onClose, getTotalIdentifiedForBatch }) {
      const [currentPage, setCurrentPage] = useState(1);
      const [batchSearch, setBatchSearch] = useState("");
      const [sortBy, setSortBy] = useState("completedAt");
      const [sortOrder, setSortOrder] = useState("desc");

      // Filter and sort data
      const filtered = useMemo(() => {
            let result = completes;

            // Filter by batch number
            if (batchSearch) {
                  result = result.filter(
                        item =>
                              (item.batch_number || "").toLowerCase().includes(batchSearch.toLowerCase())
                  );
            }

            // Sort data
            result = [...result].sort((a, b) => {
                  let aVal = a[sortBy];
                  let bVal = b[sortBy];

                  if (sortBy === 'completedAt') {
                        aVal = new Date(aVal);
                        bVal = new Date(bVal);
                  } else if (sortBy === 'materials') {
                        aVal = a.materials?.join(', ') || '';
                        bVal = b.materials?.join(', ') || '';
                  }

                  if (sortOrder === 'asc') {
                        return aVal > bVal ? 1 : -1;
                  } else {
                        return aVal < bVal ? 1 : -1;
                  }
            });

            return result;
      }, [completes, batchSearch, sortBy, sortOrder]);

      const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
      const pageData = useMemo(
            () =>
                  filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
            [filtered, currentPage]
      );

      // Generate page numbers for pagination
      const getPageNumbers = () => {
            const pages = [];
            const maxVisible = 5;

            if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                  }
            } else {
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + maxVisible - 1);

                  for (let i = start; i <= end; i++) {
                        pages.push(i);
                  }
            }

            return pages;
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-6 z-50 overflow-y-auto mt-20">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl min-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 px-8 py-6 z-10">
                              <div className="flex items-center justify-between mb-6">
                                    <div>
                                          <h2 className="text-2xl font-bold text-gray-900">Completed Requests</h2>
                                          <p className="text-gray-600 mt-1">Total: {filtered.length} records</p>
                                    </div>
                                    <button
                                          onClick={onClose}
                                          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          Close
                                    </button>
                              </div>

                              {/* Search and Filters */}
                              <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                          <label htmlFor="searchBatch" className="text-sm font-medium text-gray-700">
                                                Search Batch:
                                          </label>
                                          <input
                                                id="searchBatch"
                                                type="text"
                                                value={batchSearch}
                                                onChange={e => {
                                                      setBatchSearch(e.target.value);
                                                      setCurrentPage(1);
                                                }}
                                                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter batch number..."
                                          />
                                    </div>

                                    <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-700">Sort by:</span>
                                          <select
                                                value={sortBy}
                                                onChange={e => setSortBy(e.target.value)}
                                                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                          >
                                                <option value="completedAt">Completion Date</option>
                                                <option value="batch_number">Batch Number</option>
                                                <option value="materials">Materials</option>
                                                <option value="operator">Operator</option>
                                          </select>

                                          <button
                                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                          >
                                                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                          </button>
                                    </div>
                              </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6">
                              {pageData.length === 0 ? (
                                    <div className="text-center py-16">
                                          <div className="text-6xl mb-4">📋</div>
                                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Found</h3>
                                          <p className="text-gray-600">
                                                {batchSearch ? 'No records match your search criteria.' : 'No completed requests available.'}
                                          </p>
                                    </div>
                              ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                          {pageData.map(item => (
                                                <div
                                                      key={item.id}
                                                      className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                                                >
                                                      <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1">
                                                                  <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                                        <span className="text-xs font-semibold uppercase text-green-700 tracking-wide">
                                                                              Completed
                                                                        </span>
                                                                  </div>
                                                                  <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                                                                        {item.materials?.join(", ") || "No materials"}
                                                                  </h3>
                                                            </div>
                                                      </div>

                                                      <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                  <div>
                                                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Batch</span>
                                                                        <div className="font-mono font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded text-sm mt-1">
                                                                              {item.batch_number || "-"}
                                                                        </div>
                                                                  </div>
                                                                  <div>
                                                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Vats</span>
                                                                        <div className="font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded text-sm mt-1">
                                                                              {item.selectedVats?.join(", ") || "-"}
                                                                        </div>
                                                                  </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                  <div>
                                                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Operator</span>
                                                                        <div className="font-medium text-gray-800 text-sm mt-1">
                                                                              {item.operator}
                                                                        </div>
                                                                  </div>
                                                                  <div>
                                                                        <span className="text-xs text-gray-500 uppercase tracking-wide">QC Inspector</span>
                                                                        <div className="font-medium text-gray-800 text-sm mt-1">
                                                                              {item.inspector}
                                                                        </div>
                                                                  </div>
                                                            </div>

                                                            <div className="pt-3 border-t border-green-200">
                                                                  <span className="text-xs text-gray-500 uppercase tracking-wide">Completed At</span>
                                                                  <div className="font-medium text-gray-800 text-sm mt-1">
                                                                        {item.completedAt
                                                                              ? dayjs(item.completedAt).add(7, 'hour').format('DD MMM YYYY HH:mm:ss')
                                                                              : "N/A"} WIB
                                                                  </div>
                                                                  <div>
                                                                        {/* Progress Raman */}
                                                                        <p className={
                                                                              getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                                                                    ? 'text-green-800 bg-green-100 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                                    : 'text-yellow-800 bg-yellow-100 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                        }>
                                                                              Progress: {
                                                                                    getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                                                                          ? 'Completed Raman'
                                                                                          : 'On-progress Raman'
                                                                              }
                                                                        </p>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              )}
                        </div>

                        {/* Footer with Pagination */}
                        {totalPages > 1 && (
                              <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-200 px-8 py-6">
                                    <div className="flex items-center justify-between">
                                          <div className="text-sm text-gray-600">
                                                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
                                          </div>

                                          <div className="flex items-center gap-2">
                                                <button
                                                      disabled={currentPage === 1}
                                                      onClick={() => setCurrentPage(1)}
                                                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                      First
                                                </button>

                                                <button
                                                      disabled={currentPage === 1}
                                                      onClick={() => setCurrentPage(v => v - 1)}
                                                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                      Previous
                                                </button>

                                                <div className="flex gap-1">
                                                      {getPageNumbers().map(pageNum => (
                                                            <button
                                                                  key={pageNum}
                                                                  onClick={() => setCurrentPage(pageNum)}
                                                                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === pageNum
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'border border-gray-300 hover:bg-gray-50'
                                                                        }`}
                                                            >
                                                                  {pageNum}
                                                            </button>
                                                      ))}
                                                </div>

                                                <button
                                                      disabled={currentPage >= totalPages}
                                                      onClick={() => setCurrentPage(v => v + 1)}
                                                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                      Next
                                                </button>

                                                <button
                                                      disabled={currentPage >= totalPages}
                                                      onClick={() => setCurrentPage(totalPages)}
                                                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                      Last
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
}