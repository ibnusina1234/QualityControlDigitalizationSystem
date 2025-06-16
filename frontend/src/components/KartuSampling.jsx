import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const SamplingCard = () => {
      const [data, setData] = useState(null);
      const { id } = useParams();
      const material_id = data?.material_id;
      const componentRef = useRef();
      const [gallery, setGallery] = useState(null);
      const [galleryInfo, setGalleryInfo] = useState({ type: null, category: null });
      const navigate = useNavigate();

      useEffect(() => {
            axios
                  .get(`http://10.126.15.141:8081/cards/sampling-cards-detail/${id}`)
                  .then((res) => {
                        console.log("Respons diterima di frontend:", res.data);

                        if (res.data) {
                              setData(res.data); // Tetap simpan data utama

                              // Ekstrak dan transformasi gallery_photos jika ada
                              const rawPhotos = res.data.gallery_photos;
                              if (rawPhotos) {
                                    const formattedPhotos = {};

                                    for (const type of Object.keys(rawPhotos)) {
                                          for (const category of Object.keys(rawPhotos[type])) {
                                                const key = `${type}-${category}`;
                                                formattedPhotos[key] = rawPhotos[type][category].map((photo) => ({
                                                      fileId: photo.src,
                                                      caption: photo.caption || photo.file_name,
                                                }));
                                          }
                                    }

                              } else {
                                    console.warn("gallery_photos tidak ditemukan di respons API.");
                              }

                        } else {
                              console.warn("Data kosong diterima dari API");
                        }
                  })
                  .catch((err) => {
                        console.error("Gagal memuat data dari API:", err);
                  });
      }, [id]);

      // Fungsi untuk mencetak halaman
      const handlePrint = () => {
            const printContents = componentRef.current.innerHTML;
            
            // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Add print-specific styles
    printWindow.document.write(`
          <html>
                <head>
                      <title>Kartu Sampling - ${data?.card_number || "Print"}</title>
                      <style>
                            @page {
                                  size: A4;
                                  margin: 0;
                                  scale: 1;
                            }
                            body {
                                  margin: 0;
                                  padding: 0;
                            }
                            .print-container {
                                  width: 210mm;
                                  min-height: 297mm;
                                  padding: 15mm;
                                  margin: 0 auto;
                                  background-color: white;
                                  color: black;
                                  font-family: Arial, sans-serif;
                                  font-size: 8pt;
                                  box-sizing: border-box;
                            }
                            @media print {
                                  .print-container {
                                        width: 210mm;
                                        height: 297mm;
                                        page-break-after: always;
                                  }
                                  button {
                                        display: none !important;
                                  }
                                  
                                  /* Tambahan CSS untuk memperbaiki ukuran font */
                                  html, body {
                                        font-size: 8pt !important;
                                        transform: scale(1);
                                        -webkit-transform: scale(1);
                                        transform-origin: 0 0;
                                        -webkit-transform-origin: 0 0;
                                  }
                                  
                                  /* Pastikan semua teks di dalam container mengikuti ukuran yang sama */
                                  .print-container * {
                                        font-size: inherit !important;
                                  }
                                  
                                  /* Pengecualian untuk judul */
                                  h2 {
                                        font-size: 24pt !important;
                                  }
                                  
                                  /* Atur ukuran font spesifik untuk tabel */
                                  table {
                                        font-size: 8pt !important;
                                  }
                                  
                                  /* Pastikan tidak ada scaling atau pembesaran */
                                  * {
                                        -webkit-print-color-adjust: exact !important;
                                        color-adjust: exact !important;
                                  }
                            }
                      </style>
                </head>
                <body>
                      <div class="print-container">
                            ${printContents}
                      </div>
                </body>
          </html>
    `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Print after a short delay to ensure content is loaded
            setTimeout(function() {
                  printWindow.print();
            }, 500);
      };

      if (!data) return <div>Loading...</div>;

      // Fungsi untuk membuka galeri dengan kategori gambar tertentu
      const openGallery = (type, category) => {
            const selectedGallery = data?.gallery_photos?.[type]?.[category] || [];
            setGallery(selectedGallery);
            setGalleryInfo({ type, category });
      };

      const closeGallery = () => {
            setGallery(null);
            setGalleryInfo({ type: null, category: null });
      };

      // Fungsi untuk navigasi ke halaman berikutnya dengan menyertakan card_number
      const navigateToNextPage = () => {
            // Menggunakan card_number dari data untuk navigasi
            const cardNumber = data?.card_number;
            const namaMaterial = encodeURIComponent(data?.nama_material || "");
            const kodeMaterial = encodeURIComponent(data?.kode_item || "");
            const manufacture = encodeURIComponent(data?.manufacture || "");
            
           if (cardNumber) {
                navigate(
                      `/SamplingHistory/${cardNumber}?nama_material=${namaMaterial}&kode_material=${kodeMaterial}&manufacture=${manufacture}`
                );
           } else {
                navigate(
                      `/SamplingHistory?nama_material=${namaMaterial}&kode_material=${kodeMaterial}&manufacture=${manufacture}`
                );
                console.warn("Navigasi tanpa card_number karena data tidak tersedia");
           }
      };

      const buttonStyle = {
            margin: "2px",
            padding: "8px 10px",
            backgroundColor: "#007BFF", // Warna biru
            color: "white", // Warna teks
            border: "none", // Hilangkan border
            borderRadius: "5px", // Sudut melengkung
            cursor: "pointer", // Ubah kursor menjadi pointer saat di-hover
            fontSize: "8px", // Ukuran font
            fontWeight: "bold", // Teks tebal
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Bayangan tombol
            transition: "background-color 0.3s ease", // Efek transisi
      };

      const printButtonStyle = {
            ...buttonStyle,
            backgroundColor: "#28a745", // Warna hijau untuk tombol print
      };

      const buttonHoverStyle = {
            backgroundColor: "#0056b3", // Warna biru lebih gelap saat hover
      };

      const printButtonHoverStyle = {
            backgroundColor: "#218838", // Warna hijau lebih gelap saat hover
      };

      const boxStyle = {
            border: "1px solid black",
            padding: "10px",
            marginBottom: "10px",
      };

      const tableStyle = {
            width: "100%",
            borderCollapse: "collapse",
      };

      const tableStyle2 = {
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: "bold",
      };

      const cellStyle = {
            border: "1px solid black",
            padding: "6px",
            verticalAlign: "top",
      };

      return (
            <div>
                  <div style={{
                        display: "flex",
                        justifyContent: "flex-end", // Posisi konten di sebelah kanan
                        alignItems: "center", // Vertikal di tengah kontainer
                        height: "50px", // Tinggi kontainer
                        marginTop: "80px",
                        gap: "10px" // Jarak antar tombol
                  }}>
                        <button
                              style={printButtonStyle}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = printButtonHoverStyle.backgroundColor)}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = printButtonStyle.backgroundColor)}
                              onClick={handlePrint}
                        >
                              Print Kartu Sampling
                        </button>
                        <button
                              style={buttonStyle}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                              onClick={() => navigate(`/GalleryPDFFormat/${material_id}`)}
                        >
                              Cetak Gambar PDF
                        </button>
                  </div>

                  <div
                        ref={componentRef}
                        style={{
                              width: "210mm",
                              minHeight: "297mm",
                              padding: "15mm",
                              margin: "auto",
                              backgroundColor: "white",
                              color: "black",
                              fontFamily: "Arial, sans-serif",
                              fontSize: "8pt",
                              boxSizing: "border-box",
                              border: "1px solid #000",
                              marginTop: "60px",
                        }}
                  >
                        {/* Header */}
                        <div style={{ ...boxStyle, display: "flex", alignItems: "center" }}>
                              {/* Logo */}
                              <div style={{ width: "15%", textAlign: "left" }}>
                                    <img src="/logosaka.png" alt="Logo" style={{ maxWidth: "100%", height: "auto" }} />
                              </div>
                              {/* Title */}
                              <div style={{ width: "85%", textAlign: "center" }}>
                                    <h2 style={{ margin: 0, fontSize: "24pt", fontWeight: "bold" }}>KARTU SAMPLING</h2>
                              </div>
                        </div>
                        {/* Info Material dan Kartu Sampling */}
                        <div style={{ ...boxStyle, display: "flex" }}>
                              {/* Bagian Kiri (70%) */}
                              <div style={{ width: "70%", paddingRight: "10px" }}>
                                    <table style={tableStyle2}>
                                          <tbody>
                                                <tr>
                                                      <td>{data?.nama_material || "-"}</td>
                                                </tr>
                                                <tr>
                                                      <td>{data?.kode_item || "-"}</td>
                                                </tr>
                                                <tr>
                                                      <td>{data?.manufacture || "-"}</td>
                                                </tr>
                                          </tbody>
                                    </table>
                              </div>

                              {/* Bagian Kanan (30%) */}
                              <div style={{ width: "30%", paddingLeft: "10px", borderLeft: "1px solid black" }}>
                                    <table style={tableStyle}>
                                          <tbody>
                                                <tr>
                                                      <td style={{ width: "50%", verticalAlign: "top" }}>NO</td>
                                                      <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                      <td style={{ verticalAlign: "top" }}>{data?.card_number || "-"}</td>
                                                </tr>
                                                <tr>
                                                      <td style={{ width: "50%", verticalAlign: "top" }}>Tgl. Efektif</td>
                                                      <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                      <td style={{ verticalAlign: "top" }}>
                                                       {data?.effective_date ? new Intl.DateTimeFormat('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                      }).format(new Date(data.effective_date))
                                                            : "NA"}
                                                      </td>
                                                </tr>
                                          </tbody>
                                    </table>
                              </div>
                        </div>

                        {/* Tanda Tangan */}
                        <div style={boxStyle}>
                              <table style={tableStyle}>
                                    <thead>
                                          <tr>
                                                <th style={cellStyle}>DISUSUN OLEH</th>
                                                <th style={cellStyle} colSpan="2">DISETUJUI OLEH</th>
                                          </tr>
                                    </thead>
                                    <tbody>
                                          <tr>
                                                <td style={cellStyle}>
                                                      [TTD]<br />
                                                      {data?.qc_supervisor_name || "Pending Approval"}<br />
                                                      QC SPV.<br />
                                                      {data?.qc_supervisor_approval_date ? new Intl.DateTimeFormat('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                      }).format(new Date(data.qc_supervisor_approval_date))
                                                            : "Pending Approval"}
                                                </td>
                                                <td style={cellStyle}>
                                                      [TTD]<br />
                                                      {data?.qc_manager_name || "Pending Approval"}<br />
                                                      QC MGR.<br />
                                                      {data?.qc_manager_approval_date ? new Intl.DateTimeFormat('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                      }).format(new Date(data.qc_manager_approval_date))
                                                            : "Pending Approval"}
                                                </td>
                                                <td style={cellStyle}>
                                                      [TTD]<br />
                                                      {data?.qa_manager_name || "Pending Approval"}<br />
                                                      QA MGR.<br />
                                                      {data?.qc_manager_approval_date ? new Intl.DateTimeFormat('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                      }).format(new Date(data.qa_manager_approval_date))
                                                            : "Pending Approval"}
                                                </td>
                                          </tr>
                                    </tbody>
                              </table>
                        </div>

                        {/* Detail Material */}
                        <div style={boxStyle}>
                              <table style={tableStyle}>
                                    <tbody>
                                          <tr>
                                                <td><strong>Expired Date</strong></td>
                                                <td>: {data?.expired_date || "-"}</td>
                                          </tr>
                                          <tr>
                                                <td><strong>Suhu Penyimpanan</strong></td>
                                                <td>: {data?.storage_condition || "-"}</td>
                                          </tr>
                                          <tr>
                                                <td><strong>Status Pabrikan</strong></td>
                                                <td>: Sesuai RSR</td>
                                          </tr>
                                    </tbody>
                              </table>
                        </div>

                        {/* Kondisi Sampling */}
                        <div style={boxStyle}>
                              <strong>KONDISI SAMPLING</strong>
                              <table style={{ ...tableStyle, marginTop: "8px" }}>
                                    <tbody>
                                          <tr><td style={cellStyle}>Kondisi Sampling</td><td style={cellStyle}>: {data?.condition_desc || "-"}</td></tr>
                                          <tr><td style={cellStyle}>Kemasan Luar</td><td style={cellStyle}>: {data?.outer_packaging || "-"}</td></tr>
                                          <tr><td style={cellStyle}>Kemasan Dalam</td><td style={cellStyle}>: {data?.inner_packaging || "-"}</td></tr>
                                          <tr><td style={cellStyle}>Metode Sampling</td><td style={cellStyle}>: {data?.sampling_method || "-"}</td></tr>
                                          <tr><td style={cellStyle}>Alat yang Digunakan</td><td style={cellStyle}>: {data?.tools_used || "-"}</td></tr>
                                          <tr><td style={cellStyle}>Cara Sampling</td><td style={cellStyle}>: {data?.sampling_process || "-"}</td></tr>
                                          <tr>
                                                <td style={{ ...cellStyle, width: "40%" }}>
                                                      <strong>Jumlah Sample</strong>
                                                </td>
                                                <td style={cellStyle}>
                                                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                            <tbody>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>
                                                                              Kimia dan Fisik
                                                                              <div style={{ fontSize: "smaller", fontStyle: "italic" }}>(Reduce)</div>
                                                                        </td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "middle" }}>{data?.reduce || "-"}</td>
                                                                  </tr>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>
                                                                              Kimia dan Fisik
                                                                              <div style={{ fontSize: "smaller", fontStyle: "italic" }}>(Non Reduce)</div>
                                                                        </td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "middle" }}>{data.non_reduce || "-"}</td>
                                                                  </tr>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>LOD</td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "top" }}>{data?.lod || "-"}</td>
                                                                  </tr>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>Pertinggal</td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "top" }}>{data?.pertinggal || "-"}</td>
                                                                  </tr>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>Mikrobiologi</td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "top" }}>{data?.mikro || "-"}</td>
                                                                  </tr>
                                                                  <tr>
                                                                        <td style={{ width: "50%", verticalAlign: "top" }}>Pengujian Luar</td>
                                                                        <td style={{ width: "5%", textAlign: "center" }}>:</td>
                                                                        <td style={{ verticalAlign: "top" }}>{data?.uji_luar || "-"}</td>
                                                                  </tr>
                                                            </tbody>
                                                      </table>
                                                </td>
                                          </tr>
                                          <tr><td style={cellStyle}>Pembersihan Alat</td><td style={cellStyle}>: {data?.cleaning_tools || "-"}</td></tr>
                                    </tbody>
                              </table>
                        </div>
                        <div>
                              {/* Modal Galeri */}
                              {gallery && (
                                    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
                                          <div className="relative bg-black bg-opacity-90 rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                                <button
                                                      onClick={closeGallery}
                                                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                                >
                                                      Close
                                                </button>

                                                <h2 className="text-white text-xl font-bold mb-6 text-center">
                                                      Galeri Foto {galleryInfo?.type || ""} - {galleryInfo?.category || ""}
                                                </h2>

                                                <div className="overflow-y-auto flex-grow">
                                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {gallery.map((photo, index) => (
                                                                  <div key={index} className="flex flex-col items-center">
                                                                        <div className="w-64 h-64 bg-gray-800 overflow-hidden flex items-center justify-center">
                                                                              <img
                                                                                    src={`http://10.126.15.141:8081/cards/get-images/${photo.src}`}
                                                                                    alt={photo.caption}
                                                                                    className="w-full h-full object-contain"
                                                                              />
                                                                        </div>
                                                                        <p className="text-white mt-3 text-center w-full">{photo.caption}</p>
                                                                  </div>
                                                            ))}
                                                      </div>
                                                </div>
                                          </div>
                                    </div>
                              )}

                              {/* Foto Kemasan Section */}
                              <div className="mt-4">
                                    <h3 className="text-lg font-bold mb-2">FOTO KEMASAN</h3>
                                    <div className="overflow-x-auto">
                                          <table className="w-full border-collapse">
                                                <thead>
                                                      <tr>
                                                            <th className="border border-gray-300 bg-gray-100 p-3 text-center">KEMASAN PRIMER</th>
                                                            <th className="border border-gray-300 bg-gray-100 p-3 text-center">KEMASAN SEKUNDER</th>
                                                      </tr>
                                                </thead>
                                                <tbody>
                                                      <tr>
                                                            {/* Tombol Galeri - Primer */}
                                                            <td className="border border-gray-300 p-4 text-center">
                                                                  <div className="flex flex-wrap justify-center gap-2">
                                                                        {["Kemasan", "Segel", "Label"].map((category) => (
                                                                              <button
                                                                                    key={`Primer-${category}`}
                                                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                                                                                    onClick={() => openGallery("Primer", category)}
                                                                              >
                                                                                    Foto {category}
                                                                              </button>
                                                                        ))}
                                                                  </div>
                                                            </td>

                                                            {/* Tombol Galeri - Sekunder */}
                                                            <td className="border border-gray-300 p-4 text-center">
                                                                  <div className="flex flex-wrap justify-center gap-2">
                                                                        {["Kemasan", "Segel", "Label"].map((category) => (
                                                                              <button
                                                                                    key={`Sekunder-${category}`}
                                                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                                                                                    onClick={() => openGallery("Sekunder", category)}
                                                                              >
                                                                                    Foto {category}
                                                                              </button>
                                                                        ))}
                                                                  </div>
                                                            </td>
                                                      </tr>
                                                </tbody>
                                          </table>
                                    </div>
                              </div>
                        </div>
                        {/* Footer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", marginTop: "20px" }}>
                              {/* Teks di sisi kiri */}
                              <div style={{ textAlign: "left" }}>SOP-QC-G016.01L1</div>

                              {/* Teks di sisi kanan */}
                              <div style={{ textAlign: "right" }}>Hal 1 dari 2</div>
                        </div>
                  </div>

                  <div
                        style={{
                              display: "flex",
                              justifyContent: "center", // Menjajarkan tombol di tengah secara horizontal
                              alignItems: "center", // Menjaga tombol sejajar secara vertikal
                              gap: "20px", // Memberi jarak antar tombol
                              margin: "20px",
                        }}
                  >
                        <button
                              style={buttonStyle}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                              onClick={() => navigate("/ListSamplingCard")}
                        >
                              Kembali
                        </button>
                        <button
                              style={buttonStyle}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                              onClick={navigateToNextPage}
                        >
                              Next Page
                        </button>
                  </div>
            </div>
      );
};

export default SamplingCard;