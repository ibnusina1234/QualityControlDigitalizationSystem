import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function GalleryPDFFormat() {
  const [data, setData] = useState(null);
  const { id } = useParams();
  const [gallery, setGallery] = useState(null);
  const [galleryInfo, setGalleryInfo] = useState({ type: null, category: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isPrinting,setIsPrinting] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [totalPages, setTotalPages] = useState(0);
  
  // Reference to the page elements for counting
  const pagesRef = useRef([]);

  // Tanggal dan informasi dokumen
  const docNumber = "SOP-QC-G016.01L2";

  // Base URL untuk API
  const API_BASE_URL = "http://10.126.15.141:8081";

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/cards/sampling-cards-detail/${id}`)
      .then((res) => {
        console.log("Respons diterima di frontend:", res.data);
        if (res.data) {
          setData(res.data);
          // Count total pages based on number of sections
          if (res.data.gallery_photos) {
            // We have one page per section (primer and sekunder)
            const pages = Object.keys(res.data.gallery_photos).length;
            setTotalPages(pages);
          }
        } else {
          console.warn("Data kosong diterima dari API");
          setError("Data tidak ditemukan");
        }
      })
      .catch((err) => {
        console.error("Gagal memuat data dari API:", err);
        setError("Gagal memuat data. Silahkan periksa koneksi API");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Function to handle printing
  const handlePrint = () => {
    console.log("Print button clicked!");
    setIsPrinting(true);
    
    // Create a new window for printing only the document content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Get the document content
    const documentContent = document.querySelectorAll('.page-container');
    
    // Create HTML for the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: sans-serif;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
            .print-container {
              width: 210mm; /* A4 width */
              min-height: 297mm; /* A4 height */
              margin: 0 auto;
              background-color: white;
            }
            .page-container {
              position: relative;
              width: 210mm;
              min-height: 297mm;
              padding: 10mm;
              box-sizing: border-box;
              page-break-after: always;
            }
            .page-container:last-child {
              page-break-after: auto;
            }
            /* Copy all existing print styles */
            .bg-gray-200 {
              background-color: #e5e7eb;
            }
            .border, .border-black, .border-b {
              border: 1px solid black;
            }
            .border-b {
              border-bottom: 1px solid black;
            }
            .font-semibold {
              font-weight: 600;
            }
            .font-bold {
              font-weight: 700;
            }
            .text-xs {
              font-size: 0.75rem;
            }
            .text-sm {
              font-size: 0.875rem;
            }
            .text-base {
              font-size: 1rem;
            }
            .grid {
              display: grid;
            }
            .grid-cols-12 {
              grid-template-columns: repeat(12, minmax(0, 1fr));
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .col-span-3 {
              grid-column: span 3 / span 3;
            }
            .col-span-9 {
              grid-column: span 9 / span 9;
            }
            .flex {
              display: flex;
            }
            .flex-col {
              flex-direction: column;
            }
            .items-center {
              align-items: center;
            }
            .justify-center {
              justify-content: center;
            }
            .p-2 {
              padding: 0.5rem;
            }
            .mt-4 {
              margin-top: 1rem;
            }
            .mt-8 {
              margin-top: 2rem;
            }
            .gap-2 {
              gap: 0.5rem;
            }
            .uppercase {
              text-transform: uppercase;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .relative {
              position: relative;
            }
            .absolute {
              position: absolute;
            }
            .bottom-4 {
              bottom: 1rem;
            }
            .left-4 {
              left: 1rem;
            }
            .right-4 {
              right: 1rem;
            }
            .h-16 {
              height: 4rem;
            }
            .h-36 {
              height: 9rem;
            }
            .w-24 {
              width: 6rem;
            }
            .w-full {
              width: 100%;
            }
            .object-contain {
              object-fit: contain;
            }
            .max-h-full {
              max-height: 100%;
            }
            .max-w-full {
              max-width: 100%;
            }
            .flex-1 {
              flex: 1 1 0%;
            }
            .cursor-pointer {
              cursor: pointer;
            }
            .mb-1 {
              margin-bottom: 0.25rem;
            }
            .content-wrapper {
              min-height: calc(297mm - 20mm - 30px); /* A4 height - padding - footer height */
              display: flex;
              flex-direction: column;
            }
            .page-footer {
              position: absolute;
              bottom: 10mm;
              left: 10mm;
              right: 10mm;
              height: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
          </style>
        </head>
        <body>
          <div class="print-container"></div>
        </body>
      </html>
    `);
    
    // Copy the document content to the print window
    const printContainer = printWindow.document.querySelector('.print-container');
    documentContent.forEach((element, index) => {
      const clonedElement = element.cloneNode(true);
      
      // Remove any interactive elements or classes
      const allButtons = clonedElement.querySelectorAll('button');
      allButtons.forEach(btn => btn.remove());
      
      printContainer.appendChild(clonedElement);
    });
    
    // Wait for content to load then print
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
    }, 500);
  };

  // Function to open gallery with specific category images
  const openGallery = (type, category) => {
    if (data?.gallery_photos && data.gallery_photos[type] && data.gallery_photos[type][category]) {
      const selectedGallery = data.gallery_photos[type][category];
      setGallery(selectedGallery);
      setGalleryInfo({ type, category });
    } else {
      console.warn(`Gallery photos for ${type}/${category} not found`);
    }
  };

  // Function to close gallery
  const closeGallery = () => {
    setGallery(null);
    setGalleryInfo({ type: null, category: null });
  };

  // Function to handle image error
  const handleImageError = (e) => {
    e.target.src = "/api/placeholder/200/150"; // Fallback to placeholder
    console.warn("Image failed to load, using placeholder instead");
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  if (!data) return <div className="flex justify-center items-center h-screen">Data tidak tersedia</div>;

  // Get product info from data or use default
  const productInfo = {
    nama: data.nama_material || "Tidak Ada Nama",
    kode: data.kode_item || "Tidak Ada Kode",
    produsen: data.manufacture || "Tidak Ada Produsen"
  };

  // Helper function to render gallery section
  const renderGallerySection = (type, category, photoData) => {
    if (!photoData || photoData.length === 0) {
      return <div className="text-center p-4">Tidak ada foto {category}</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {photoData.map((photo, idx) => (
          <div 
            key={idx} 
            className="border border-black p-1 cursor-pointer hover:bg-gray-100"
            onClick={() => openGallery(type, category)}
          >
            <div className="h-36 bg-gray-100 flex items-center justify-center">
              {photo.src ? (
                <img 
                  src={`${API_BASE_URL}/cards/get-images/${photo.src}`}
                  alt={photo.caption || "Product image"} 
                  className="max-h-full max-w-full object-contain"
                  onError={handleImageError}
                />
              ) : (
                <img 
                  src="/api/placeholder/200/150" 
                  alt="placeholder" 
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <p className="text-center text-xs mt-1">{photo.caption || "No caption"}</p>
          </div>
        ))}
      </div>
    );
  };

  // Generate pages dynamically based on data
  const generatePages = () => {
    const pages = [];
    
    if (!data.gallery_photos) return pages;
    
    // Get all section keys from the data (e.g., Primer, Sekunder, etc.)
    const sectionKeys = Object.keys(data.gallery_photos);
    const totalPageCount = sectionKeys.length;
    
    // Generate a page for each section
    sectionKeys.forEach((sectionKey, sectionIndex) => {
      const currentPage = sectionIndex + 1;
      const sectionData = data.gallery_photos[sectionKey];
      const categories = sectionData ? Object.keys(sectionData) : [];
      
      pages.push(
        <div 
          key={`page-${currentPage}`} 
          className="page-container w-full bg-white border border-black text-xs font-sans relative print:border-none"
          ref={el => pagesRef.current[sectionIndex] = el}
        >
          {/* Content wrapper with minimum height to push footer to bottom */}
          <div className="content-wrapper">
            {/* Header - Common to all pages */}
            <div className="border-b border-black">
              <div className="grid grid-cols-12">
                {/* Left section with company logo */}
                <div className="col-span-3 p-2 border-r border-black flex items-center justify-center">
                  <div className="font-bold text-sm">PT. SAKA FARMA</div>
                </div>

                {/* Title section */}
                <div className="col-span-9 flex items-center justify-center p-2">
                  <h1 className="font-bold text-base">GALERI FOTO KEMASAN PRODUK</h1>
                </div>
              </div>
            </div>

            {/* Informasi Produk - Common to all pages */}
            <div className="border-b border-black p-2">
              <div className="flex">
                <div className="font-semibold w-24">Nama Produk</div>
                <div className="font-semibold mr-1">:</div>

                {/* Kontainer tengah */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="uppercase font-semibold">{productInfo.nama}</div>
                  <div className="uppercase font-semibold">{productInfo.kode}</div>
                  <div className="uppercase font-semibold">{productInfo.produsen}</div>
                </div>
              </div>
            </div>

            {/* Section Header (Primer or Sekunder) */}
            <div className="border-b border-black">
              <div className="bg-gray-200 font-semibold p-2 border-b border-black print:bg-gray-200">
                KEMASAN {sectionKey.toUpperCase()}
              </div>
              
              {/* Render each category (Kemasan, Segel, Label) */}
              {categories.map((category, categoryIndex) => (
                <div 
                  key={`${sectionKey}-${category}`} 
                  className={`p-2 ${categoryIndex < categories.length - 1 ? 'border-b border-black' : ''}`}
                >
                  <div className="font-semibold mb-1">Foto {category}:</div>
                  {renderGallerySection(sectionKey, category, sectionData[category])}
                </div>
              ))}
            </div>

          </div>

          {/* Footer - Fixed to bottom of page with dynamic page numbering */}
          <div className="page-footer">
            <div className="text-xs">{docNumber}</div>
            <div className="text-xs">Hal {currentPage} dari {totalPageCount}</div>
          </div>
        </div>
      );
    });
    
    return pages;
  };

  return (
    <div className="relative min-h-screen pb-10">
      {/* Print Button */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-red-600 text-white px-6 py-3 rounded-md shadow-lg hover:bg-red-700 font-bold"
        >
          Cetak PDF
        </button>
      </div>
      
      {/* Content container */}
      <div className="flex flex-col items-center mt-20 print:mt-0">
        {/* Generate pages dynamically */}
        {generatePages()}
      </div>

      {/* Gallery Modal */}
      {gallery && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="relative bg-black bg-opacity-90 rounded-lg p-6 w-11/12 max-w-4xl max-h-screen overflow-hidden flex flex-col">
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>

            <h2 className="text-white text-xl font-bold mb-6 text-center">
              Galeri Foto {galleryInfo?.type} - {galleryInfo?.category}
            </h2>

            <div className="overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((photo, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-64 h-64 bg-gray-800 overflow-hidden flex items-center justify-center">
                      {photo.src ? (
                        <img
                          src={`${API_BASE_URL}/cards/get-images/${photo.src}`}
                          alt={photo.caption || "Product image"}
                          className="w-full h-full object-contain"
                          onError={handleImageError}
                        />
                      ) : (
                        <img 
                          src="/api/placeholder/200/150" 
                          alt="placeholder" 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <p className="text-white mt-3 text-center w-full">{photo.caption || "No caption"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              width: 210mm;
              height: 297mm;
            }
            .print\\:hidden {
              display: none !important;
            }
            .page-container {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 10mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              border: none !important;
            }
            .page-container:last-child {
              page-break-after: auto !important;
            }
            .bg-gray-200, .print\\:bg-gray-200 {
              background-color: #e5e7eb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cursor-pointer {
              cursor: default !important;
            }
            .hover\\:bg-gray-100:hover {
              background-color: transparent !important;
            }
          }
        `
      }} />
    </div>
  );
}