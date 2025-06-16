
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function SamplingHistory() {
      const navigate = useNavigate();
      const { cardNumber } = useParams(); // Get the card number from URL params
      const location = useLocation();
      const searchParams = new URLSearchParams(location.search);
      const nama_material = searchParams.get("nama_material");
      const kode_material = searchParams.get("kode_material");
      const manufacture = searchParams.get("manufacture");

      const [historyData, setHistoryData] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
            if (!cardNumber) {
                  setLoading(false);
                  setError("Nomor kartu sampling tidak ditemukan.");
                  return;
            }

            const fetchHistory = async () => {
                  try {
                        // Extract the prefix from the card number (first 9 characters)
                        const prefix = cardNumber.slice(0, 9);
                        const response = await fetch(`http://10.126.15.141:8081/cards/sampling-card-history/${prefix}`);

                        if (!response.ok) throw new Error("Gagal mengambil data riwayat sampling.");

                        const responseData = await response.json();

                        // Handle history data format properly to ensure we can render it
                        if (responseData && Array.isArray(responseData)) {
                              // Data dari server langsung sebagai array
                              setHistoryData(responseData);
                        } else if (responseData.historyData && Array.isArray(responseData.historyData)) {
                              // Data dari server dalam property historyData
                              setHistoryData(responseData.historyData);
                        } else {
                              console.warn("Format data tidak sesuai:", responseData);
                              setHistoryData([]);
                        }

                  } catch (err) {
                        console.error("Error fetching data:", err);
                        setError(err.message);
                  } finally {
                        setLoading(false);
                  }
            };

            fetchHistory();
      }, [cardNumber]);

      // Fungsi untuk mencetak halaman
      const handlePrint = () => {
            // Menyimpan konten tombol saat ini untuk dapat dikembalikan setelah cetak
            const printButtons = document.getElementById('printButtons');

            // Sembunyikan tombol-tombol saat mencetak
            if (printButtons) {
                  printButtons.style.display = 'none';
            }

            // Cetak halaman
            window.print();

            // Kembalikan tampilan tombol setelah cetak
            if (printButtons) {
                  printButtons.style.display = 'flex';
            }
      };

      if (loading) {
            return (
                  <div className="flex justify-center items-center h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="ml-3">Memuat data...</p>
                  </div>
            );
      }

      if (error) {
            return (
                  <div className="flex flex-col items-center max-w-[1000px] mx-auto py-6 mt-20">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                              <p>{error}</p>
                        </div>
                        <button
                              onClick={() => navigate(-1)}
                              className="flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-md shadow-md mt-6 mx-auto"
                        >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Kembali
                        </button>
                  </div>
            );
      }

      // Debug output ke console
      console.log("Data untuk ditampilkan:", historyData);

      return (
            <div className="flex flex-col items-center max-w-[1000px] mx-auto py-6 mt-20">
                  {/* Document Container */}
                  <div id="printContent" className="w-[210mm] h-[297mm] mx-auto border border-black text-[11px] font-sans relative bg-white">
                        {/* Header */}
                        <div className="border-b border-black">
                              <div className="grid grid-cols-12">
                                    {/* Left section with PT. SAKA FARMA */}
                                    <div className="col-span-3 p-2 border-r border-black flex items-center justify-center">
                                          <img src="/logosaka.png" alt="Logo Saka Farma" className="h-12 object-contain" />
                                    </div>

                                    {/* Title section */}
                                    <div className="col-span-9 flex items-center justify-center p-2">
                                          <h1 className="font-bold text-base">Sejarah Perubahan Kartu Sampling</h1>
                                    </div>
                              </div>
                        </div>

                        {/* Nama Bahan section */}
                        <div className="border-b border-black p-2">
                              <div className="flex">
                                    <div className="font-semibold w-24 mt-3">Nama Bahan</div>
                                    <div className="font-semibold mr-1 items-center mt-3">:</div>

                                    {/* Kontainer tengah */}
                                    <div className="flex-1 flex flex-col items-center">
                                          <div className="uppercase font-semibold">{nama_material || "-"}</div>
                                          <div className="uppercase font-semibold">{kode_material || "-"}</div>
                                          <div className="uppercase font-semibold">{manufacture || "-"}</div>
                                    </div>
                              </div>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 text-center">
                              <div className="col-span-4 border-r border-b border-black py-1 px-2 font-semibold">
                                    Nomor Kartu Sampling
                              </div>
                              <div className="col-span-3 border-r border-b border-black py-1 px-2 font-semibold">
                                    Tgl. Efektif
                              </div>
                              <div className="col-span-5 border-b border-black py-1 px-2 font-semibold">
                                    Alasan Perubahan
                              </div>
                        </div>

                        {/* Table Body */}
                        {historyData && historyData.length > 0 ? (
                              historyData.map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-12">
                                          <div className="col-span-4 border-r border-b border-black p-2">
                                                {row.card_number || "-"}
                                          </div>
                                          <div className="col-span-3 border-r border-b border-black p-2 text-center text-blue-600">
                                                {row.effective_date ? new Intl.DateTimeFormat('en-GB', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric'
                                                }).format(new Date(row.effective_date))
                                                      : "NA"}
                                          </div>
                                          <div className="col-span-5 border-b border-black p-2">
                                                {row.history || "-"}
                                          </div>
                                    </div>
                              ))
                        ) : (
                              <div className="grid grid-cols-12">
                                    <div className="col-span-12 border-b border-black p-2 text-center">
                                          Tidak ada data riwayat yang tersedia
                                    </div>
                              </div>
                        )}

                        {/* Empty space in the middle */}
                        <div className="flex-grow"></div>

                        {/* Footer */}
                        <div className="absolute bottom-2 left-2 text-xs">
                              SOP-QC-G016.01L1
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs">
                              Hal 2 dari 2
                        </div>
                  </div>

                  {/* Buttons container */}
                  <div id="printButtons" className="flex justify-center space-x-4 mt-6">
                        <button
                              onClick={() => navigate(-1)}
                              className="flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-md shadow-md"
                        >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Kembali
                        </button>

                        <button
                              onClick={handlePrint}
                              className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded-md shadow-md"
                        >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v9m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Cetak
                        </button>
                  </div>

                  {/* CSS untuk mencetak */}
                  <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printContent, #printContent * {
            visibility: visible;
          }
          #printContent {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
            </div>
      );
}