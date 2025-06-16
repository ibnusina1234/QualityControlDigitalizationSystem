import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react"; // GUNAKAN Chakra UI HOOK ASLI!

export default function SamplingHistoryForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [newEntries, setNewEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEntry, setNewEntry] = useState({
    card_number: "",
    effective_date: "",
    history: "",
  });

  // --- DARK/LIGHT MODE COLOR PALETTE (PAKAI CHAKRA HOOK) ---
  const _bgMain = useColorModeValue("#f9fafb", "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)");
  const _bgCard = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(17, 24, 39, 0.95)");
  const _borderSection = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
  const _sectionBg = useColorModeValue("linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", "linear-gradient(135deg, #1f2937 0%, #111827 100%)");
  const _sectionHover = useColorModeValue("linear-gradient(135deg, #c7d2fe 0%, #e9d5ff 100%)", "linear-gradient(135deg, #374151 0%, #1f2937 100%)");
  const _textSection = useColorModeValue("#1e293b", "#f1f5f9");
  const _cardTitle = useColorModeValue("#6366f1", "#a78bfa");
  const _inputBorder = useColorModeValue("rgba(139, 92, 246, 0.4)", "rgba(75, 85, 99, 0.8)");
  const _inputBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(31, 41, 55, 0.8)");
  const _inputTextColor = useColorModeValue("#1e293b", "#e2e8f0");
  const _inputFocus = useColorModeValue("#8b5cf6", "#a78bfa");
  const _btnBg = useColorModeValue("linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)");
  const _cancelBtnBg = useColorModeValue("linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", "linear-gradient(135deg, #374151 0%, #4b5563 100%)");
  const _headerBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(17, 24, 39, 0.9)");
  const _headerText = useColorModeValue("#1e293b", "#f1f5f9");
  const _errorBg = useColorModeValue("rgba(254, 226, 226, 0.8)", "rgba(127, 29, 29, 0.3)");
  const _errorBorder = useColorModeValue("#f87171", "#dc2626");
  const _headerBtnColor = useColorModeValue("#6366f1", "#a78bfa");
  const _borderColorConfirm = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
  const _searchBtnBg = useColorModeValue("linear-gradient(135deg, #10b981 0%, #059669 100%)", "linear-gradient(135deg, #065f46 0%, #047857 100%)");
  const _hapusBtnBg = useColorModeValue("rgba(254, 226, 226, 0.5)", "rgba(127, 29, 29, 0.2)");
  const _spinnerBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(17, 24, 39, 0.9)");
  const _spinnerBorder = useColorModeValue("#8b5cf6", "#a78bfa");
  const _shadowInnerInfo = useColorModeValue("0 0 16px 0 #e0e7ff", "0 0 32px 0 #111827");
  const _boxShadowHeader = useColorModeValue("0 8px 32px 0 rgba(102,126,234,0.08)", "0 8px 32px 0 rgba(44,44,84,0.55)");
  const _headerTextShadow = useColorModeValue("0 2px 8px #bdbdff", "0 2px 16px #22223b");

  // Ambil data kartu dari localStorage
  useEffect(() => {
    const storedData = localStorage.getItem("tempSamplingCardData");
    if (storedData) setFormData(JSON.parse(storedData));
  }, []);

  // Fetch history setelah formData tersedia
  useEffect(() => {
    if (!formData?.card_number) return;
    const fetchHistory = async () => {
      try {
        const prefix = formData.card_number.slice(0, 9);
        const response = await fetch(`http://localhost:8081/cards/sampling-card-history/${prefix}`);
        if (!response.ok) throw new Error("Gagal mengambil data riwayat sampling.");
        const data = await response.json();
        setHistoryData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    const { card_number, effective_date, history } = newEntry;
    if (!card_number || !effective_date || !history) {
      alert("Semua field harus diisi.");
      return;
    }
    const entry = { ...newEntry };
    setHistoryData((prev) => [entry, ...prev]);
    setNewEntries((prev) => [entry, ...prev]);
    setNewEntry({ card_number: "", effective_date: "", history: "" });
  };

  const handleRemoveEntry = (index) => {
    const removed = historyData[index];
    const newHistory = [...historyData];
    newHistory.splice(index, 1);
    setHistoryData(newHistory);
    setNewEntries((prev) =>
      prev.filter(
        (entry) =>
          !(
            entry.card_number === removed.card_number &&
            entry.effective_date === removed.effective_date &&
            entry.history === removed.history
          )
      )
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  const handleSubmit = async () => {
    if (newEntries.length === 0) {
      alert("Tidak ada entry baru untuk disimpan.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8081/cards/send-sampling-card-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntries),
      });
      if (!response.ok) throw new Error("Gagal menyimpan data ke server.");
      alert("Data berhasil disimpan!");
      setNewEntries([]);
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan.");
    }
  };

  if (loading || !formData)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: _bgMain }}
      >
        <div
          className="flex flex-col items-center backdrop-blur-sm rounded-2xl p-8 shadow-2xl border"
          style={{
            background: _spinnerBg,
            borderColor: _borderSection,
          }}
        >
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: `${_spinnerBorder} transparent transparent transparent`,
            }}
          ></div>
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: _textSection }}
          >
            Memuat data riwayat...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: _bgMain }}
      >
        <div
          className="backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md text-center border"
          style={{
            background: _errorBg,
            borderColor: _errorBorder,
          }}
        >
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: _textSection }}
          >
            Error
          </h2>
          <p style={{ color: _textSection }}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{
              background: _btnBg,
              color: "white",
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen py-8 px-4 mt-20"
      style={{ background: _bgMain, transition: "background 0.3s" }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-2xl border"
          style={{
            background: _headerBg,
            borderColor: _borderSection,
            boxShadow: _boxShadowHeader,
            transition: "background 0.3s, box-shadow 0.3s"
          }}
        >
          <h1
            className="text-3xl font-bold text-center tracking-wide"
            style={{
              color: _headerText,
              letterSpacing: ".05em",
              textShadow: _headerTextShadow,
              transition: "color 0.3s, text-shadow 0.3s"
            }}
          >
            Sejarah Perubahan Kartu Sampling
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SIDE - FORM INPUT */}
          <div className="lg:w-1/2 flex flex-col gap-6">
            {/* FORM INFO BAHAN */}
            <div
              className="backdrop-blur-sm rounded-2xl p-6 shadow-2xl border transition-all duration-300 hover:shadow-3xl"
              style={{
                background: _bgCard,
                borderColor: _borderSection,
                transition: "background 0.3s, border-color 0.3s"
              }}
            >
              <h2
                className="text-xl font-bold mb-4 flex items-center tracking-wide"
                style={{ color: _cardTitle, letterSpacing: ".02em", transition: "color 0.3s" }}
              >
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  background: "linear-gradient(90deg,#a78bfa,#6366f1)", borderRadius: "50%",
                  marginRight: 12, boxShadow: "0 2px 8px #20255e33"
                }}></span>
                Informasi Bahan
              </h2>
              {formData && (
                <div
                  className="p-4 rounded-xl shadow-inner"
                  style={{
                    background: _sectionBg,
                    boxShadow: _shadowInnerInfo,
                    transition: "background 0.3s, box-shadow 0.3s"
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        Nama Bahan
                      </label>
                      <input
                        type="text"
                        value={formData.nama_material || ""}
                        className="w-full p-3 rounded-xl shadow-sm border"
                        style={{
                          background: _inputBg,
                          borderColor: _inputBorder,
                          color: _inputTextColor,
                          transition: "background 0.3s, border-color 0.3s, color 0.3s"
                        }}
                        readOnly
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        Kode Bahan
                      </label>
                      <input
                        type="text"
                        value={formData.kode_item || ""}
                        className="w-full p-3 rounded-xl shadow-sm border"
                        style={{
                          background: _inputBg,
                          borderColor: _inputBorder,
                          color: _inputTextColor,
                          transition: "background 0.3s, border-color 0.3s, color 0.3s"
                        }}
                        readOnly
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={formData.manufacture || ""}
                        className="w-full p-3 rounded-xl shadow-sm border"
                        style={{
                          background: _inputBg,
                          borderColor: _inputBorder,
                          color: _inputTextColor,
                          transition: "background 0.3s, border-color 0.3s, color 0.3s"
                        }}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FORM TAMBAH RIWAYAT */}
            <div
              className="backdrop-blur-sm rounded-2xl p-6 shadow-2xl border transition-all duration-300 hover:shadow-3xl"
              style={{
                background: _bgCard,
                borderColor: _borderSection,
                transition: "background 0.3s, border-color 0.3s"
              }}
            >
              <h2
                className="text-xl font-bold mb-4 flex items-center tracking-wide"
                style={{ color: _cardTitle, letterSpacing: ".02em", transition: "color 0.3s" }}
              >
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  background: "linear-gradient(90deg,#a78bfa,#6366f1)", borderRadius: "50%",
                  marginRight: 12, boxShadow: "0 2px 8px #20255e33"
                }}></span>
                Tambah Riwayat Perubahan
              </h2>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: _textSection, transition: "color 0.3s" }}
                    >
                      Nomor Kartu Sampling
                    </label>
                    <input
                      type="text"
                      name="card_number"
                      value={newEntry.card_number}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl shadow-sm border focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all duration-300"
                      style={{
                        background: _inputBg,
                        borderColor: _inputBorder,
                        color: _inputTextColor,
                        transition: "background 0.3s, border-color 0.3s, color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = _inputFocus}
                      onBlur={(e) => e.target.style.borderColor = _inputBorder}
                      placeholder="Masukkan nomor kartu"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: _textSection, transition: "color 0.3s" }}
                    >
                      Tanggal Efektif
                    </label>
                    <input
                      type="date"
                      name="effective_date"
                      value={newEntry.effective_date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full p-3 rounded-xl shadow-sm border focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all duration-300"
                      style={{
                        background: _inputBg,
                        borderColor: _inputBorder,
                        color: _inputTextColor,
                        transition: "background 0.3s, border-color 0.3s, color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = _inputFocus}
                      onBlur={(e) => e.target.style.borderColor = _inputBorder}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: _textSection, transition: "color 0.3s" }}
                  >
                    Alasan Perubahan
                  </label>
                  <textarea
                    name="history"
                    value={newEntry.history}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-3 rounded-xl shadow-sm border focus:ring-2 focus:ring-opacity-50 focus:outline-none resize-none transition-all duration-300"
                    style={{
                      background: _inputBg,
                      borderColor: _inputBorder,
                      color: _inputTextColor,
                      transition: "background 0.3s, border-color 0.3s, color 0.3s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = _inputFocus}
                    onBlur={(e) => e.target.style.borderColor = _inputBorder}
                    placeholder="Deskripsikan alasan perubahan..."
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 text-white font-semibold"
                    style={{
                      background: _searchBtnBg,
                      letterSpacing: ".03em",
                      transition: "background 0.3s"
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Riwayat
                  </button>
                </div>
              </form>
            </div>

            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 font-semibold"
                style={{
                  background: _cancelBtnBg,
                  color: _textSection,
                  transition: "background 0.3s, color 0.3s"
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>

              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 text-white font-semibold"
                style={{ background: _btnBg, transition: "background 0.3s" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Simpan Data
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - PREVIEW */}
          <div className="lg:w-1/2">
            <div
              className="backdrop-blur-sm rounded-2xl p-6 shadow-2xl sticky top-6 border"
              style={{
                background: _bgCard,
                borderColor: _borderSection,
                transition: "background 0.3s, border-color 0.3s"
              }}
            >
              <h2
                className="text-xl font-bold mb-4 flex items-center tracking-wide"
                style={{ color: _cardTitle, letterSpacing: ".02em", transition: "color 0.3s" }}
              >
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  background: "linear-gradient(90deg,#3b82f6,#06b6d4)", borderRadius: "50%",
                  marginRight: 12,
                }}></span>
                Preview Dokumen
              </h2>
              <div
                className="w-full rounded-2xl overflow-hidden shadow-2xl border"
                style={{ borderColor: _borderColorConfirm, transition: "border-color 0.3s" }}
              >
                <div
                  className="border-b grid grid-cols-12"
                  style={{
                    borderColor: _borderSection,
                    background: _sectionBg,
                    transition: "background 0.3s, border-color 0.3s"
                  }}
                >
                  <div
                    className="col-span-3 p-2 border-r flex justify-center items-center"
                    style={{ borderColor: _borderSection }}
                  >
                    <img src="/logosaka.png" alt="Logo Saka" className="h-12 object-contain" />
                  </div>
                  <div className="col-span-9 flex items-center justify-center p-2">
                    <h1
                      className="font-bold text-base"
                      style={{ color: _textSection, letterSpacing: ".03em", transition: "color 0.3s" }}
                    >
                      Sejarah Perubahan Kartu Sampling
                    </h1>
                  </div>
                </div>
                <div
                  className="border-b p-3"
                  style={{
                    borderColor: _borderSection,
                    background: _sectionBg,
                    transition: "background 0.3s, border-color 0.3s"
                  }}
                >
                  <div className="flex">
                    <div
                      className="font-semibold w-24"
                      style={{ color: _textSection, transition: "color 0.3s" }}
                    >
                      Nama Bahan
                    </div>
                    <div
                      className="font-semibold mr-1"
                      style={{ color: _textSection, transition: "color 0.3s" }}
                    >
                      :
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="uppercase font-semibold"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        {formData?.nama_material}
                      </div>
                      <div
                        className="uppercase font-semibold"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        {formData?.kode_item}
                      </div>
                      <div
                        className="uppercase font-semibold"
                        style={{ color: _textSection, transition: "color 0.3s" }}
                      >
                        {formData?.manufacture}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="grid grid-cols-12 text-center"
                  style={{ background: _sectionBg, transition: "background 0.3s" }}
                >
                  <div
                    className="col-span-4 border-r border-b py-2 font-semibold"
                    style={{
                      borderColor: _borderSection,
                      color: _textSection,
                      transition: "color 0.3s, border-color 0.3s"
                    }}
                  >
                    Nomor Kartu Sampling
                  </div>
                  <div
                    className="col-span-3 border-r border-b py-2 font-semibold"
                    style={{
                      borderColor: _borderSection,
                      color: _textSection,
                      transition: "color 0.3s, border-color 0.3s"
                    }}
                  >
                    Tgl. Efektif
                  </div>
                  <div
                    className="col-span-5 border-b py-2 font-semibold"
                    style={{
                      borderColor: _borderSection,
                      color: _textSection,
                      transition: "color 0.3s, border-color 0.3s"
                    }}
                  >
                    Alasan Perubahan
                  </div>
                </div>
                <div className="max-h-[440px] overflow-y-auto">
                  {historyData.length === 0 ? (
                    <div
                      className="p-8 text-center flex flex-col items-center justify-center"
                      style={{
                        background: _sectionBg,
                        color: _textSection,
                        transition: "background 0.3s, color 0.3s"
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Belum ada data riwayat.</p>
                      <p className="text-sm mt-1 opacity-75">Tambahkan data pada form di sebelah kiri.</p>
                    </div>
                  ) : (
                    historyData.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 transition-all duration-300 hover:shadow-lg"
                        style={{
                          background: idx % 2 === 0 ? _inputBg : _sectionBg,
                          borderRadius: idx === 0 ? "0 0 12px 12px" : "none",
                          transition: "background 0.3s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = _sectionHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? _inputBg : _sectionBg}
                      >
                        <div
                          className="col-span-4 border-r border-b p-3 truncate"
                          style={{
                            borderColor: _borderSection,
                            color: _textSection,
                            transition: "color 0.3s, border-color 0.3s"
                          }}
                        >
                          {row.card_number}
                        </div>
                        <div
                          className="col-span-3 border-r border-b p-3 text-center font-semibold"
                          style={{
                            borderColor: _borderSection,
                            color: _headerBtnColor,
                            transition: "color 0.3s, border-color 0.3s"
                          }}
                        >
                          {formatDate(row.effective_date)}
                        </div>
                        <div
                          className="col-span-5 border-b p-3 flex justify-between items-center"
                          style={{
                            borderColor: _borderSection,
                            color: _textSection,
                            transition: "color 0.3s, border-color 0.3s"
                          }}
                        >
                          <span className="line-clamp-2">{row.history}</span>
                          <button
                            onClick={() => handleRemoveEntry(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md"
                            style={{
                              background: _hapusBtnBg,
                              border: "none"
                            }}
                            title="Hapus entry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}