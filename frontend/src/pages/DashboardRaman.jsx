import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Clock, CheckCircle, Eye, Calendar, Package, RefreshCw, Boxes, ChevronLeft,ChevronRight } from 'lucide-react';

const RamanMonitoringDashboard = () => {
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('all');
      const [selectedMaterial, setSelectedMaterial] = useState(null);
      const [showDetail, setShowDetail] = useState(false);
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate || (() => { });
      const [currentPage, setCurrentPage] = useState(1);
      const rowsPerPage = 10;

      const [materials, setMaterials] = useState([]);

      const fetchMaterials = async () => {
            setLoading(true);
            try {
                  const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/raman/getDashboardData`);
                  setMaterials(response.data);
            } catch (error) {
                  console.error("Error fetching data:", error);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchMaterials();
      }, []);

      const getStatusColor = (progress) => {
            return progress === 100 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
      };

      const getStatusIcon = (progress) => {
            return progress === 100 ? CheckCircle : Clock;
      };

      const getProgressPercentage = (identified, total) => {
            return Math.round((identified / total) * 100);
      };

      const formatDateTime = (dateString) => {
            return new Date(dateString).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
            });
      };

      const showMaterialDetail = (material) => {
            setSelectedMaterial(material);
            setShowDetail(true);
      };

      const refreshData = () => {
            fetchMaterials();
      };

      const totalMaterials = materials.length;
      const onProgressCount = materials.filter(m => getProgressPercentage(m.identified_vats, m.total_vats) < 100).length;
      const completeCount = materials.filter(m => getProgressPercentage(m.identified_vats, m.total_vats) === 100).length;

      return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 mt-20">
                  <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Raman Monitoring Dashboard</h1>
                                          <p className="text-gray-600 mt-1">Pemantauan Material yang Diidentifikasi</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                          <button onClick={() => navigate('/DashboardSampelRMPM')} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                                                <Boxes className="h-4 w-4" /> Dashboard RMPM
                                          </button>
                                          <button onClick={refreshData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                          </button>
                                    </div>
                              </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                              <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <input
                                                type="text"
                                                placeholder="Cari material atau batch..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                    </div>
                                    <div className="flex items-center gap-2">
                                          <Filter className="h-4 w-4 text-gray-400" />
                                          <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          >
                                                <option value="all">Semua Status</option>
                                                <option value="on_progress">On Progress</option>
                                                <option value="complete">Complete</option>
                                          </select>
                                    </div>
                              </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <p className="text-sm font-medium text-gray-600">Total Material</p>
                                                <p className="text-2xl font-bold text-gray-900">{totalMaterials}</p>
                                          </div>
                                          <Package className="h-8 w-8 text-blue-500" />
                                    </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <p className="text-sm font-medium text-gray-600">On Progress</p>
                                                <p className="text-2xl font-bold text-yellow-600">{onProgressCount}</p>
                                          </div>
                                          <Clock className="h-8 w-8 text-yellow-500" />
                                    </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <p className="text-sm font-medium text-gray-600">Complete</p>
                                                <p className="text-2xl font-bold text-green-600">{completeCount}</p>
                                          </div>
                                          <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                      {Math.round(materials.reduce((acc, m) => acc + (m.identified_vats / m.total_vats), 0) / materials.length * 100)}%
                                                </p>
                                          </div>
                                          <Eye className="h-8 w-8 text-blue-500" />
                                    </div>
                              </div>
                        </div>

                       <div className="bg-white rounded-xl shadow-sm overflow-hidden">
  <div className="p-6 border-b border-gray-200">
    <h2 className="text-xl font-semibold text-gray-900">Daftar Material</h2>
  </div>
  {loading ? (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ) : (
    <>
      <div className="divide-y divide-gray-200">
        {(() => {
          const seenBatchNumbers = new Set();
          const uniqueMaterials = materials.filter((m) => {
            if (seenBatchNumbers.has(m.batch_number)) return false;
            seenBatchNumbers.add(m.batch_number);
            return true;
          });

          const filtered = uniqueMaterials.filter((material) => {
            const matchesSearch =
              material.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
              material.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
            const progress = getProgressPercentage(material.identified_vats, material.total_vats);
            const matchesFilter =
              filterStatus === 'all' ||
              (filterStatus === 'on_progress' && progress < 100) ||
              (filterStatus === 'complete' && progress === 100);
            return matchesSearch && matchesFilter;
          });

      //     const totalPages = Math.ceil(filtered.length / rowsPerPage);
          const startIdx = (currentPage - 1) * rowsPerPage;
          const paginated = filtered.slice(startIdx, startIdx + rowsPerPage);

          return paginated.map((material) => {
            const progress = getProgressPercentage(material.identified_vats, material.total_vats);
            const StatusIcon = getStatusIcon(progress);
            return (
              <div
                key={material.batch_number}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => showMaterialDetail(material)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{material.batch_number}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(progress)}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {progress === 100 ? 'Complete' : 'On Progress'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>Total Vat: {material.total_vats}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Identified: {material.identified_vats}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {material.identified_vats} / {material.total_vats}
                      </div>
                      <div className="text-sm text-gray-600">Vat teridentifikasi</div>
                    </div>
                    <div className="w-full md:w-32">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">{progress}%</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center px-6 py-4 border-t">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-sm text-gray-600">
          Page <strong>{currentPage}</strong>
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              prev < Math.ceil(materials.length / rowsPerPage) ? prev + 1 : prev
            )
          }
          disabled={currentPage === Math.ceil(materials.filter((m, i, arr) =>
            arr.findIndex(a => a.batch_number === m.batch_number) === i
          ).length / rowsPerPage)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )}
</div>


                  </div>

                  {showDetail && selectedMaterial && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6 border-b border-gray-200">
                                          <div className="flex items-center justify-between">
                                                <div>
                                                      <h3 className="text-xl font-semibold text-gray-900">Detail Material</h3>
                                                      <p className="text-gray-600">{selectedMaterial.material} - {selectedMaterial.batch_number}</p>
                                                </div>
                                                <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">
                                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                </button>
                                          </div>
                                    </div>
                                    <div className="p-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                      <h4 className="font-medium text-gray-900 mb-2">Informasi Material</h4>
                                                      <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between"><span className="text-gray-600">Material:</span><span className="font-medium">{selectedMaterial.material}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-600">Batch:</span><span className="font-medium">{selectedMaterial.batch_number}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-600">Total Vat:</span><span className="font-medium">{selectedMaterial.total_vats}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-600">Teridentifikasi:</span><span className="font-medium text-green-600">{selectedMaterial.identified_vats}</span></div>
                                                      </div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                      <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                                                      <div className="space-y-3">
                                                            <div className="flex justify-between text-sm">
                                                                  <span>Progress</span>
                                                                  <span>{getProgressPercentage(selectedMaterial.identified_vats, selectedMaterial.total_vats)}%</span>
                                                            </div>
                                                            <div className="bg-gray-200 rounded-full h-3">
                                                                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${getProgressPercentage(selectedMaterial.identified_vats, selectedMaterial.total_vats)}%` }}></div>
                                                            </div>
                                                            <div className="text-xs text-gray-500">{selectedMaterial.total_vats - selectedMaterial.identified_vats} vat tersisa</div>
                                                      </div>
                                                </div>
                                          </div>
                                          <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900 mb-4">Riwayat Identifikasi</h4>
                                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                                      {selectedMaterial.identifications.map((identification) => (
                                                            <div key={identification.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                                                  <div className="flex justify-between items-start">
                                                                        <div className="flex items-center gap-2">
                                                                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Vat {identification.vat_number}</span>
                                                                              <span className="text-sm text-gray-600">oleh {identification.inspector}</span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">{formatDateTime(identification.identified_at)}</span>
                                                                  </div>
                                                            </div>
                                                      ))}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default RamanMonitoringDashboard;
