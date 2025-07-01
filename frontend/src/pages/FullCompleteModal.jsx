import React, { useState, useMemo } from "react";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useColorModeValue } from "@chakra-ui/react";
dayjs.extend(utc);
dayjs.extend(timezone);

const PAGE_SIZE = 20;

export default function FullCompleteModal({ completes, onClose, getTotalIdentifiedForBatch }) {
      const [currentPage, setCurrentPage] = useState(1);
      const [batchSearch, setBatchSearch] = useState("");
      const [sortBy, setSortBy] = useState("completedAt");
      const [sortOrder, setSortOrder] = useState("desc");

      // THEME COLORS
      const bgModal = useColorModeValue("bg-white", "bg-gray-900");
      const bgHeader = useColorModeValue("bg-white", "bg-gray-800");
      const borderHeader = useColorModeValue("border-gray-200", "border-gray-700");
      const textMain = useColorModeValue("text-gray-900", "text-gray-100");
      const textSecondary = useColorModeValue("text-gray-600", "text-gray-400");
      const cardBg = useColorModeValue("from-green-50 to-emerald-50", "from-green-900/50 to-emerald-900/30");
      const cardBorder = useColorModeValue("border-green-200", "border-green-700");
      const cardText = useColorModeValue("text-gray-900", "text-gray-100");
      const cardHighlight = useColorModeValue("bg-green-100 text-green-800", "bg-green-900 text-green-200");
      const cardWarn = useColorModeValue("bg-yellow-100 text-yellow-800", "bg-yellow-900 text-yellow-200");
      const batchBg = useColorModeValue("bg-purple-100 text-purple-700", "bg-purple-900 text-purple-200");
      const vatsBg = useColorModeValue("bg-blue-100 text-blue-700", "bg-blue-900 text-blue-200");
      const borderFooter = useColorModeValue("border-gray-200", "border-gray-700");
      const bgFooter = useColorModeValue("bg-white", "bg-gray-800");
      const buttonActive = useColorModeValue("bg-blue-600 text-white", "bg-blue-500 text-white");
      const buttonDefault = useColorModeValue("border border-gray-300 hover:bg-gray-50", "border border-gray-700 hover:bg-gray-800");
      const modalOverlay = useColorModeValue("bg-black bg-opacity-60", "bg-black bg-opacity-70");

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
        <div className={`fixed inset-0 ${modalOverlay} flex items-start justify-center p-6 z-50 overflow-y-auto mt-20`}>
          <div className={`${bgModal} rounded-2xl shadow-2xl w-full max-w-4xl min-h-[85vh] flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className={`sticky top-0 ${bgHeader} rounded-t-2xl border-b ${borderHeader} px-8 py-6 z-10`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${textMain}`}>Completed Requests</h2>
                  <p className={`${textSecondary} mt-1`}>Total: {filtered.length} records</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
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
                  <label htmlFor="searchBatch" className="text-sm font-medium text-gray-700 dark:text-gray-200">
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
                    className={`border ${borderHeader} px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-inherit ${textMain}`}
                    placeholder="Enter batch number..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className={`border ${borderHeader} px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 bg-inherit ${textMain}`}
                  >
                    <option value="completedAt">Completion Date</option>
                    <option value="batch_number">Batch Number</option>
                    <option value="materials">Materials</option>
                    <option value="operator">Operator</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`px-3 py-2 border ${borderHeader} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${textMain}`}
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
                  <h3 className={`text-xl font-semibold ${textMain} mb-2`}>No Data Found</h3>
                  <p className={textSecondary}>
                    {batchSearch ? 'No records match your search criteria.' : 'No completed requests available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pageData.map(item => (
                    <div
                      key={item.id}
                      className={`bg-gradient-to-br ${cardBg} border ${cardBorder} rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-semibold uppercase text-green-700 dark:text-green-200 tracking-wide">
                              Completed
                            </span>
                          </div>
                          <h3 className={`font-bold text-lg ${cardText} mb-2 leading-tight`}>
                            {item.materials?.join(", ") || "No materials"}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide">Batch</span>
                            <div className={`font-mono font-semibold rounded text-sm mt-1 ${batchBg}`}>
                              {item.batch_number || "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide">Vats</span>
                            <div className={`font-semibold rounded text-sm mt-1 ${vatsBg}`}>
                              {item.selectedVats?.join(", ") || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide">Operator</span>
                            <div className={`font-medium ${cardText} text-sm mt-1`}>
                              {item.operator}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide">QC Inspector</span>
                            <div className={`font-medium ${cardText} text-sm mt-1`}>
                              {item.inspector}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-green-200 dark:border-green-800">
                          <span className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide">Completed At</span>
                          <div className={`font-medium ${cardText} text-sm mt-1`}>
                            {item.completedAt
                              ? dayjs(item.completedAt).add(7, 'hour').format('DD MMM YYYY HH:mm:ss')
                              : "N/A"} WIB
                          </div>
                          <div>
                            <p className={
                              getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                ? `${cardHighlight} px-2 py-1 rounded text-xs inline-block font-semibold`
                                : `${cardWarn} px-2 py-1 rounded text-xs inline-block font-semibold`
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
              <div className={`sticky bottom-0 ${bgFooter} rounded-b-2xl border-t ${borderFooter} px-8 py-6`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${textSecondary}`}>
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className={`px-3 py-2 text-sm rounded-lg ${buttonDefault} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      First
                    </button>

                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(v => v - 1)}
                      className={`px-3 py-2 text-sm rounded-lg ${buttonDefault} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {getPageNumbers().map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum ? buttonActive : buttonDefault
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(v => v + 1)}  
                      className={`px-3 py-2 text-sm rounded-lg ${buttonDefault} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Next
                    </button>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 text-sm rounded-lg ${buttonDefault} disabled:opacity-50 disabled:cursor-not-allowed`}
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