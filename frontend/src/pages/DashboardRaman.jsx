import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, CheckCircle, Eye, Calendar, Package, RefreshCw, Boxes, ChevronLeft, ChevronRight, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';

const RamanMonitoringDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [animateCards, setAnimateCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const rowsPerPage = 10;

  // Mock data for demonstration
      const [materials, setMaterials] = useState([]);
  const fetchMaterials = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real implementation, replace with actual API call
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/raman/getDashboardData`);
      setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setAnimateCards(true);
      setTimeout(() => setAnimateCards(false), 600);
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
  const avgProgress = Math.round(materials.reduce((acc, m) => acc + (m.identified_vats / m.total_vats), 0) / materials.length * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-16">
      {/* Header Section - Full Width */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-16 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Raman Monitoring Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Pemantauan Material yang Diidentifikasi</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {/* navigate('/DashboardSampelRMPM') */}} 
                disabled={loading} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                <Boxes className="h-5 w-5" /> 
                <span className="font-medium">Dashboard RMPM</span>
              </button>
              <button 
                onClick={refreshData} 
                disabled={loading} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className={`h-5 w-5 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} /> 
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari material atau batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-lg"
              />
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3 border border-gray-200/50">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="on_progress">On Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Full Width Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${animateCards ? 'animate-bounce' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Material</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalMaterials}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">+2.5%</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 border border-yellow-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${animateCards ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">On Progress</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{onProgressCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 font-medium">Active</span>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-6 border border-green-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${animateCards ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Complete</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{completeCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Finished</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 border border-purple-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${animateCards ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{avgProgress}%</p>
                <div className="w-full bg-purple-100 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${avgProgress}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-2xl">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Material List - Full Width */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Daftar Material
            </h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-b-2 border-blue-300 opacity-75"></div>
              </div>
              <span className="ml-4 text-lg font-medium text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200/50">
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

                  const startIdx = (currentPage - 1) * rowsPerPage;
                  const paginated = filtered.slice(startIdx, startIdx + rowsPerPage);

                  return paginated.map((material, index) => {
                    const progress = getProgressPercentage(material.identified_vats, material.total_vats);
                    const StatusIcon = getStatusIcon(progress);
                    return (
                      <div
                        key={material.batch_number}
                        className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer border-l-4 border-transparent hover:border-blue-500 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => showMaterialDetail(material)}
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">{material.batch_number}</h3>
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(progress)} transition-all duration-300 hover:scale-110`}
                              >
                                <StatusIcon className="h-4 w-4" />
                                {progress === 100 ? 'Complete' : 'On Progress'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                                <Package className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Material: {material.material}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                                <Calendar className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Total Vat: {material.total_vats}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">Identified: {material.identified_vats}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-4 min-w-0 xl:min-w-[300px]">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {material.identified_vats} / {material.total_vats}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">Vat teridentifikasi</div>
                            </div>
                            <div className="w-full">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Progress</span>
                                <span className="text-sm font-bold text-gray-900">{progress}%</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                    progress === 100 
                                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                  }`}
                                  style={{ 
                                    width: `${progress}%`,
                                    transform: `translateX(-${100 - progress}%)`,
                                    animation: 'slideIn 1s ease-out forwards'
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Enhanced Pagination */}
              <div className="flex justify-between items-center px-6 py-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl text-gray-700 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Halaman <strong className="text-lg text-gray-900">{currentPage}</strong> dari{' '}
                    <strong className="text-lg text-gray-900">
                      {Math.ceil(materials.filter((m, i, arr) =>
                        arr.findIndex(a => a.batch_number === m.batch_number) === i
                      ).length / rowsPerPage)}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(materials.length / rowsPerPage) ? prev + 1 : prev
                    )
                  }
                  disabled={currentPage === Math.ceil(materials.filter((m, i, arr) =>
                    arr.findIndex(a => a.batch_number === m.batch_number) === i
                  ).length / rowsPerPage)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl text-gray-700 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Modal */}
      {showDetail && selectedMaterial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 animate-slide-up">
            <div className="p-8 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Detail Material</h3>
                  <p className="text-xl text-gray-600 font-medium">{selectedMaterial.material} - {selectedMaterial.batch_number}</p>
                </div>
                <button 
                  onClick={() => setShowDetail(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110 transform p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
                  <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Informasi Material
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Material:</span>
                      <span className="font-bold text-gray-900 text-lg">{selectedMaterial.material}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Batch:</span>
                      <span className="font-bold text-gray-900 text-lg">{selectedMaterial.batch_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Vat:</span>
                      <span className="font-bold text-gray-900 text-lg">{selectedMaterial.total_vats}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Teridentifikasi:</span>
                      <span className="font-bold text-green-600 text-lg">{selectedMaterial.identified_vats}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
                  <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    Progress
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Progress</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {getProgressPercentage(selectedMaterial.identified_vats, selectedMaterial.total_vats)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000" 
                        style={{ width: `${getProgressPercentage(selectedMaterial.identified_vats, selectedMaterial.total_vats)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {selectedMaterial.total_vats - selectedMaterial.identified_vats} vat tersisa
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50">
                <h4 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
                  <Activity className="h-6 w-6 text-gray-600" />
                  Riwayat Identifikasi
                </h4>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {selectedMaterial.identifications.map((identification, index) => (
                    <div 
                      key={identification.id} 
                      className="bg-white rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                            Vat {identification.vat_number}
                          </span>
                          <span className="text-gray-600 font-medium">oleh {identification.inspector}</span>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                          {formatDateTime(identification.identified_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS Styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
        
        /* Enhanced hover effects */
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Progress bar animation */
        .progress-bar {
          position: relative;
          overflow: hidden;
        }
        
        .progress-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        /* Card gradient hover effect */
        .card-gradient {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.3s ease;
        }
        
        .card-gradient:hover {
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          transform: translateY(-2px);
        }
        
        /* Floating animation for icons */
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        /* Pulse effect for active elements */
        .pulse-effect {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition: all 0.2s ease;
        }
        
        /* Enhanced focus styles */
        input:focus, select:focus, button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* Loading shimmer effect */
        .loading-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        /* Responsive grid improvements */
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1025px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* Enhanced backdrop blur */
        .backdrop-blur-enhanced {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        /* Smooth modal transitions */
        .modal-enter {
          opacity: 0;
          transform: scale(0.95);
        }
        
        .modal-enter-active {
          opacity: 1;
          transform: scale(1);
          transition: all 0.3s ease;
        }
        
        .modal-exit {
          opacity: 1;
          transform: scale(1);
        }
        
        .modal-exit-active {
          opacity: 0;
          transform: scale(0.95);
          transition: all 0.3s ease;
        }
        
        /* Enhanced button effects */
        .btn-glow {
          position: relative;
          overflow: hidden;
        }
        
        .btn-glow::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn-glow:hover::before {
          left: 100%;
        }
        
        /* Status badge animations */
        .status-badge {
          position: relative;
          overflow: hidden;
        }
        
        .status-badge::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        
        .status-badge:hover::after {
          transform: translateX(100%);
        }
        
        /* Material card hover effects */
        .material-card {
          position: relative;
          overflow: hidden;
        }
        
        .material-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .material-card:hover::before {
          opacity: 1;
        }
        
        /* Progress bar glow effect */
        .progress-glow {
          position: relative;
        }
        
        .progress-glow::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6);
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
          animation: rotate 2s linear infinite;
        }
        
        .progress-glow:hover::after {
          opacity: 0.3;
        }
        
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RamanMonitoringDashboard;