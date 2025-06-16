import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react"; // ✅ Pakai Chakra UI hook asli

export default function SamplingMasterlist() {
      const navigate = useNavigate();
      const [data, setData] = useState([]);
      const [cardMap, setCardMap] = useState({});
      const [searchTerm, setSearchTerm] = useState("");
      const [loading, setLoading] = useState(true);
      const [statusFilter, setStatusFilter] = useState(""); // <-- Tambah status filter

      // Color mode values
      const _bgMain = useColorModeValue("linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)");
      const _bgCard = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(17, 24, 39, 0.95)");
      const _borderSection = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
      const _sectionBg = useColorModeValue("linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", "linear-gradient(135deg, #1f2937 0%, #111827 100%)");
      const _sectionHover = useColorModeValue("linear-gradient(135deg, #c7d2fe 0%, #e9d5ff 100%)", "linear-gradient(135deg, #374151 0%, #1f2937 100%)");
      const _textSection = useColorModeValue("#1e293b", "#f1f5f9");
      const _inputBorder = useColorModeValue("rgba(139, 92, 246, 0.4)", "rgba(75, 85, 99, 0.8)");
      const _inputBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(31, 41, 55, 0.8)");
      const _inputFocus = useColorModeValue("#8b5cf6", "#a78bfa");
      const _btnBg = useColorModeValue("linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)");
      const _cancelBtnBg = useColorModeValue("linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", "linear-gradient(135deg, #374151 0%, #4b5563 100%)");
      const _headerBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(17, 24, 39, 0.9)");
      const _headerText = useColorModeValue("#1e293b", "#f1f5f9");
      const _inputTextColor = useColorModeValue("#1e293b", "#e2e8f0");
      const _spinnerBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(17, 24, 39, 0.9)");
      const _spinnerBorder = useColorModeValue("#8b5cf6", "#a78bfa");
      const _searchBtnBg = useColorModeValue("linear-gradient(135deg, #10b981 0%, #059669 100%)", "linear-gradient(135deg, #065f46 0%, #047857 100%)");
      const _pagesBtnBg = useColorModeValue("linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)");

      useEffect(() => {
            const fetchData = async () => {
                  try {
                        const listResponse = await fetch("http://10.126.15.141:8081/cards/list-sampling-cards");
                        const partResponse = await fetch("http://10.126.15.141:8081/cards/part-sampling-cards");

                        const listData = await listResponse.json();
                        const partData = await partResponse.json();

                        if (Array.isArray(listData) && Array.isArray(partData)) {
                              setData(listData);
                              const map = {};
                              partData.forEach((item) => {
                                    map[item.material_id] = item.card_number;
                              });
                              setCardMap(map);
                        } else {
                              throw new Error("Data tidak sesuai format yang diharapkan");
                        }
                  } catch (error) {
                        console.error("Error fetching data:", error);
                        alert("Terjadi kesalahan saat mengambil data. Silakan coba lagi.");
                  } finally {
                        setLoading(false);
                  }
            };

            fetchData();
      }, []);

      const getCardNumber = (material_id) => {
            return cardMap[material_id] || "-";
      };

      // Filter by search term
      let filteredData = data.filter((item) =>
            item.nama_material?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filter by status dropdown
      if (statusFilter) {
            filteredData = filteredData.filter((item) => {
                  if (statusFilter === "Approved") return item.status === "Approved";
                  if (statusFilter === "Pending") return item.status === "Pending";
                  if (statusFilter === "Reject") return item.status === "Reject";
                  return true;
            });
      }

      const deleteSamplingCard = async (id) => {
            const isConfirmed = window.confirm("Apakah kamu yakin ingin menghapus kartu sampling ini?");
            if (!isConfirmed) return;

            try {
                  const response = await fetch(`http://10.126.15.141:8081/cards/sampling-card-delete/${id}`, {
                        method: "DELETE",
                  });

                  const result = await response.json();

                  if (response.ok) {
                        alert(result.message);
                        setData((prevData) => prevData.filter((item) => item.id !== id));
                  } else {
                        alert("❌ Gagal menghapus kartu: " + result.error);
                  }
            } catch (err) {
                  console.error("Error:", err);
                  alert("❌ Terjadi kesalahan saat menghapus kartu.");
            }
      };

      return (
            <div
                  className="min-h-screen transition-all duration-300"
                  style={{ background: _bgMain }}
            >
                  {/* Header with gradient background */}
                  <div
                        className="backdrop-blur-sm shadow-lg mt-20 border-b transition-all duration-300"
                        style={{
                              background: _headerBg,
                              borderColor: _borderSection,
                              color: _headerText
                        }}
                  >
                        <div className="max-w-7xl mx-auto p-6">
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Masterlist Kartu Sampling
                              </h1>
                              <p className="mt-2 opacity-80 font-medium">Pengelolaan data kartu sampling material</p>
                        </div>
                  </div>

                  {/* Main content */}
                  <div className="max-w-7xl mx-auto p-4 sm:p-6">
                        {/* Action bar */}
                        <div
                              className="rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-sm border transition-all duration-300 hover:shadow-2xl"
                              style={{
                                    background: _bgCard,
                                    borderColor: _borderSection
                              }}
                        >
                              <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Search field */}
                                    <div className="relative flex-grow">
                                          <div
                                                className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
                                                style={{ color: _inputFocus }}
                                          >
                                                <Search size={20} />
                                          </div>
                                          <input
                                                type="text"
                                                placeholder="Cari berdasarkan nama material..."
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 backdrop-blur-sm font-medium"
                                                style={{
                                                      background: _inputBg,
                                                      borderColor: _inputBorder,
                                                      color: _inputTextColor,
                                                      boxShadow: `0 0 0 0 ${_inputFocus}40`
                                                }}
                                                onFocus={(e) => {
                                                      e.target.style.borderColor = _inputFocus;
                                                      e.target.style.boxShadow = `0 0 0 4px ${_inputFocus}20`;
                                                }}
                                                onBlur={(e) => {
                                                      e.target.style.borderColor = _inputBorder;
                                                      e.target.style.boxShadow = `0 0 0 0 ${_inputFocus}40`;
                                                }}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                          />
                                    </div>

                                    {/* Status dropdown */}
                                    <div>
                                          <select
                                                value={statusFilter}
                                                onChange={e => setStatusFilter(e.target.value)}
                                                className="w-full sm:w-48 px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium focus:outline-none"
                                                style={{
                                                      background: _inputBg,
                                                      borderColor: _inputBorder,
                                                      color: _inputTextColor
                                                }}
                                          >
                                                <option value="">Semua Status</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Reject">Reject</option>
                                          </select>
                                    </div>

                                    {/* Add button */}
                                    <button
                                          onClick={() => navigate("/EditSamplingCard")}
                                          className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-white"
                                          style={{ background: _btnBg }}
                                    >
                                          <Plus size={20} />
                                          <span>Tambah Data</span>
                                    </button>
                              </div>
                        </div>

                        {/* Table card */}
                        <div
                              className="rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border transition-all duration-300"
                              style={{
                                    background: _bgCard,
                                    borderColor: _borderSection
                              }}
                        >
                              {loading ? (
                                    <div
                                          className="p-12 text-center"
                                          style={{ background: _spinnerBg }}
                                    >
                                          <div
                                                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-6"
                                                style={{ borderColor: _spinnerBorder }}
                                          ></div>
                                          <p className="text-lg font-medium" style={{ color: _textSection }}>
                                                Memuat data...
                                          </p>
                                    </div>
                              ) : filteredData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y-2" style={{ borderColor: _borderSection }}>
                                                <thead style={{ background: _sectionBg }}>
                                                      <tr>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: _textSection }}>No</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: _textSection }}>No. KS</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: _textSection }}>Nama Material</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: _textSection }}>Manufacture</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: _textSection }}>Kode Item</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: _textSection }}>Tanggal</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: _textSection }}>Status</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: _textSection }}>PIC</th>
                                                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider" style={{ color: _textSection }}>Aksi</th>
                                                      </tr>
                                                </thead>
                                                <tbody className="divide-y" style={{ borderColor: _borderSection }}>
                                                      {filteredData.map((item, index) => (
                                                            <tr
                                                                  key={item.id || index}
                                                                  className="transition-all duration-200 hover:transform hover:scale-[1.01]"
                                                                  style={{ background: _bgCard }}
                                                                  onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = _sectionHover;
                                                                  }}
                                                                  onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = _bgCard;
                                                                  }}
                                                            >
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: _textSection }}>{index + 1}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{getCardNumber(item.id)}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: _textSection }}>{item.nama_material || "-"}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell" style={{ color: _textSection, opacity: 0.8 }}>{item.manufacture || "-"}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell" style={{ color: _textSection, opacity: 0.8 }}>{item.kode_item || "-"}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell" style={{ color: _textSection, opacity: 0.8 }}>
                                                                        {item?.created_at ? (
                                                                              new Intl.DateTimeFormat('en-GB', {
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                              }).format(new Date(item.created_at))
                                                                        ) : (
                                                                              "-"
                                                                        )}
                                                                  </td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                                                                        <span
                                                                              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm
                                                                                          ${item.status === "Pending"
                                                                                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                                                                                          : item.status === "Approved"
                                                                                                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                                                                                                : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                                                                                    }`}
                                                                        >
                                                                              {item.status || "-"}
                                                                        </span>
                                                                  </td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell font-medium" style={{ color: _textSection }}>{item.created_by || "-"}</td>
                                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                                        <div className="flex justify-center space-x-3">
                                                                              {item.status === "Approved" && (
                                                                                    <button
                                                                                          onClick={() => navigate(`/KartuSampling/${item.id}`)}
                                                                                          className="p-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                                                                          style={{
                                                                                                background: _searchBtnBg,
                                                                                                color: 'white'
                                                                                          }}
                                                                                          title="Buka"
                                                                                    >
                                                                                          <FileText size={18} />
                                                                                    </button>
                                                                              )}
                                                                              <button
                                                                                    onClick={() => deleteSamplingCard(item.id)}
                                                                                    className="p-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                                                                    style={{
                                                                                          background: _pagesBtnBg,
                                                                                          color: 'white'
                                                                                    }}
                                                                                    title="Hapus"
                                                                              >
                                                                                    <Trash2 size={18} />
                                                                              </button>
                                                                        </div>
                                                                  </td>
                                                            </tr>
                                                      ))}
                                                </tbody>
                                          </table>
                                    </div>
                              ) : (
                                    <div className="p-12 text-center">
                                          <div
                                                className="inline-block p-4 rounded-2xl mb-6 shadow-lg"
                                                style={{ background: _sectionBg }}
                                          >
                                                <Search size={32} style={{ color: _inputFocus }} />
                                          </div>
                                          <p className="text-lg font-semibold mb-2" style={{ color: _textSection }}>
                                                Tidak ada data yang ditemukan.
                                          </p>
                                          <p className="text-sm opacity-70" style={{ color: _textSection }}>
                                                Coba ubah kata kunci pencarian atau tambahkan data baru.
                                          </p>
                                    </div>
                              )}
                        </div>

                        {/* Pagination */}
                        {filteredData.length > 0 && (
                              <div
                                    className="mt-8 flex justify-between items-center text-sm rounded-xl p-4 backdrop-blur-sm shadow-lg"
                                    style={{
                                          background: _bgCard,
                                          color: _textSection,
                                          borderColor: _borderSection
                                    }}
                              >
                                    <div className="font-semibold">
                                          Menampilkan {filteredData.length} dari {filteredData.length} data
                                    </div>
                                    <div className="flex items-center space-x-2">
                                          <button
                                                className="px-4 py-2 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 font-medium"
                                                style={{
                                                      background: _cancelBtnBg,
                                                      borderColor: _borderSection,
                                                      color: _textSection
                                                }}
                                                disabled
                                          >
                                                &laquo; Prev
                                          </button>
                                          <button
                                                className="px-4 py-2 rounded-lg border-2 font-bold text-white shadow-md"
                                                style={{ background: _btnBg }}
                                          >
                                                1
                                          </button>
                                          <button
                                                className="px-4 py-2 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 font-medium"
                                                style={{
                                                      background: _cancelBtnBg,
                                                      borderColor: _borderSection,
                                                      color: _textSection
                                                }}
                                                disabled
                                          >
                                                Next &raquo;
                                          </button>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
}