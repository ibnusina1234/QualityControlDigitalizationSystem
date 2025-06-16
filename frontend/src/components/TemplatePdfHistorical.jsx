import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSelector } from "react-redux";

const PdfGenerator = ({
  room,
  startDate,
  endDate,
  data,
  temperatureData,
  rhData,
  summary
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const formatRoomName = (name) => {
    return name.replace(/_/g, ' ');
  };

  const reduxUser = useSelector((state) => state.user.user);
  const currentUser = reduxUser?.inisial || "N/A";

  // Custom header heights
  const headerWithInfoHeight = 63; // for first page (header + info)
  const headerOnlyHeight = 40;     // for page 2+ (header only)
  const footerHeight = 18;
  const tableMargin = 15;
  const totalPagesExp = "{totalPages}";

  const handleExportPDF = async () => {
    setIsExporting(true);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Load Logo
    const img = new Image();
    img.src = '/logosaka.png'; // Replace with base64 if needed
    await new Promise((resolve) => { img.onload = resolve; });

    // Render header/footer for each page
    function renderHeaderFooter(pageNumber) {
      // === HEADER ===
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(15, 10, 65, 30); // Left box for logo/company info

      // Logo
      const adjustedLogoWidth = 30;
      const adjustedLogoHeight = 20;
      pdf.addImage(img, 'PNG', 18, 13, adjustedLogoWidth, adjustedLogoHeight);

      // Main title box
      pdf.rect(80, 10, pageWidth - 95, 30);

      // Title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const titleCenterX = 80 + (pageWidth - 95) / 2;
      pdf.text("LAPORAN PEMANTAUAN SUHU DAN RH", titleCenterX, 25, { align: 'center' });

      if (pageNumber === 1) {
        // Info box only on first page
        const infoStartY = 45;
        const infoHeight = 22;
        pdf.rect(15, infoStartY, pageWidth - 30, infoHeight);
        const lineHeight = 6;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Nama Ruangan: ${formatRoomName(room) || '-'}`, 18, infoStartY + lineHeight);
        pdf.text(`Tanggal: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 18, infoStartY + lineHeight * 2);
        pdf.text(`Dicetak oleh: ${currentUser}`, 18, infoStartY + lineHeight * 2.8);
      }

      // === FOOTER ===
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      // Left bottom
      pdf.text('SOP-QC-XXXX.01', 15, pageHeight - 10);
      // Right bottom: Page X of Y
      const pageText = `Halaman ${pageNumber} dari ${totalPagesExp}`;
      pdf.text(pageText, pageWidth - 15, pageHeight - 10, { align: 'right' });
      // Timestamp above left bottom
      pdf.text(`Laporan dibuat pada: ${new Date().toLocaleString()}`, 15, pageHeight - 15);
    }

    // Table margins for ALL pages
    // On page 1, table should start after info box (headerWithInfoHeight)
    // On page 2+, table should start after header only (headerOnlyHeight)
    // Use margin.top for ALL pages, so table auto-positions correctly
    const marginObj = { 
      top: headerWithInfoHeight,     // top margin for ALL pages, 
      bottom: footerHeight + 5, 
      left: tableMargin, 
      right: tableMargin 
    };

    // --- TABLE 1: Summary Table ---
    autoTable(pdf, {
      startY: headerWithInfoHeight + 7, // only affects first page, gives space after info box
      margin: marginObj, // margin.top will be used for subsequent pages automatically
      head: [['Parameter', 'Suhu (°C)', 'RH (%)']],
      body: [
        ['Rata-rata', summary.avgTemp, summary.avgRH],
        ['Minimum', summary.minTemp, summary.minRH],
        ['Maximum', summary.maxTemp, summary.maxRH],
        ['Total Data', { content: summary.total, colSpan: 2 }]
      ],
      styles: { halign: 'center' },
      headStyles: { fillColor: [0, 0, 0] },
      theme: 'grid',
      didDrawPage: function () {
        renderHeaderFooter(pdf.internal.getCurrentPageInfo().pageNumber);
      },
      pageBreak: 'auto'
    });

    // --- TABLE 2: Main Data Table ---
    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      margin: marginObj,
      head: [['Tanggal & Waktu', 'Suhu (°C)', 'RH (%)']],
      body: data.length === 0
        ? [['Tidak ada data', '', '']]
        : data.map((item) => [
          new Date(item.timestamp < 1e12 ? item.timestamp * 1000 : item.timestamp).toLocaleString(),
          (Math.round(item.data_format_0 * 10) / 10).toFixed(1),
          (Math.round(item.data_format_1 * 10) / 10).toFixed(1)
        ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 1) {
          const suhu = parseFloat(data.cell.raw);
          if (suhu > 25) {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [255, 0, 0];
          }
        }
      },
      didDrawPage: function () {
        renderHeaderFooter(pdf.internal.getCurrentPageInfo().pageNumber);
      },
      pageBreak: 'auto'
    });

    // --- SIGNATURE AREA ---
    let finalY = pdf.lastAutoTable.finalY + 20;
    if (finalY + 40 > pageHeight - footerHeight) {
      pdf.addPage();
      finalY = headerOnlyHeight + 10;
      renderHeaderFooter(pdf.internal.getCurrentPageInfo().pageNumber);
    }
    // Fix total page numbering
    if (typeof pdf.putTotalPages === "function") {
      pdf.putTotalPages(totalPagesExp);
    }

    pdf.save(`Monitoring_${room}_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.pdf`);
    setIsExporting(false);
  };

  return (
    <>
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition shadow-sm text-white ${isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#f0f9ff",
          }}
        >
          {isExporting ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" stroke="gray" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
        </div>
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
    </>
  );
};

export default PdfGenerator;