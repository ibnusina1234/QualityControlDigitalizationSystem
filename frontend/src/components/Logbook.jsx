import React, { useState } from 'react';
import { useColorModeValue } from "@chakra-ui/react";

export default function LogbookLabQC() {
  const [namaAlat, setNamaAlat] = useState('');
  const [entries, setEntries] = useState(Array(15).fill(null).map(() => ({
    no: '',
    tanggal: '',
    waktuMulai: '',
    kegiatanYangDilakukan: '',
    namaKodeSampel: '',
    noBatchIdSampel: '',
    tanggalSampel: '',
    waktuSelesai: '',
    paraf: '',
    catatan: ''
  })));

  // Chakra color mode values
  const bgMain = useColorModeValue("bg-white", "bg-gray-900");
  const textMain = useColorModeValue("text-gray-900", "text-gray-100");
  const borderColor = useColorModeValue("border-black", "border-gray-400");
  const thBg = useColorModeValue("bg-gray-100", "bg-gray-800");
  const inputBg = useColorModeValue("bg-white", "bg-gray-800");
  const inputText = useColorModeValue("text-gray-900", "text-gray-100");
  const logoBg = useColorModeValue("bg-orange-500 text-white", "bg-orange-600 text-gray-100");

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value
    };
    setEntries(newEntries);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 ${bgMain} mt-20 ${textMain}`}>
      {/* Header */}
      <div className={`border-2 mb-4 ${borderColor}`}>
        <div className="flex">
          {/* Logo Section */}
          <div className={`border-r p-2 flex items-center justify-center w-32 ${borderColor}`}>
            <div className={`${logoBg} px-2 py-1 text-xs font-bold rounded`}>
              SAKAFARMA<br/>
              LABORATORIES
            </div>
          </div>
          
          {/* Title Section */}
          <div className="flex-1 p-3 text-center">
            <h1 className="text-lg font-bold">LOGBOOK PENGGUNAAN ALAT LABORATORIUM QC</h1>
          </div>
        </div>
      </div>

      {/* Nama Alat */}
      <div className="mb-4">
        <label className="font-semibold">Nama Alat: </label>
        <input
          type="text"
          value={namaAlat}
          onChange={(e) => setNamaAlat(e.target.value)}
          className={`border-b outline-none ml-2 min-w-96 ${borderColor} ${inputBg} ${inputText}`}
          placeholder="Masukkan nama alat"
        />
      </div>

      {/* Table */}
      <div className={`border-2 ${borderColor}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className={thBg}>
              <th className={`border p-2 text-xs font-semibold w-8 ${borderColor}`}>No</th>
              <th className={`border p-2 text-xs font-semibold w-20 ${borderColor}`}>Tanggal</th>
              <th className={`border p-2 text-xs font-semibold w-16 ${borderColor}`}>Waktu Mulai</th>
              <th className={`border p-2 text-xs font-semibold w-32 ${borderColor}`}>Kegiatan yang Dilakukan</th>
              <th className={`border p-2 text-xs font-semibold w-28 ${borderColor}`}>Nama/Kode Sampel</th>
              <th className={`border p-2 text-xs font-semibold w-24 ${borderColor}`}>No. Batch / ID Sampel</th>
              <th className={`border p-2 text-xs font-semibold w-20 ${borderColor}`}>Tanggal</th>
              <th className={`border p-2 text-xs font-semibold w-16 ${borderColor}`}>Waktu Selesai</th>
              <th className={`border p-2 text-xs font-semibold w-16 ${borderColor}`}>Paraf</th>
              <th className={`border p-2 text-xs font-semibold w-24 ${borderColor}`}>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index}>
                <td className={`border p-1 text-center ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.no}
                    onChange={(e) => handleEntryChange(index, 'no', e.target.value)}
                    className={`w-full text-xs text-center outline-none ${inputBg} ${inputText}`}
                    placeholder={index + 1}
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="date"
                    value={entry.tanggal}
                    onChange={(e) => handleEntryChange(index, 'tanggal', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="time"
                    value={entry.waktuMulai}
                    onChange={(e) => handleEntryChange(index, 'waktuMulai', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.kegiatanYangDilakukan}
                    onChange={(e) => handleEntryChange(index, 'kegiatanYangDilakukan', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                    placeholder="Kegiatan..."
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.namaKodeSampel}
                    onChange={(e) => handleEntryChange(index, 'namaKodeSampel', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                    placeholder="Nama/Kode..."
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.noBatchIdSampel}
                    onChange={(e) => handleEntryChange(index, 'noBatchIdSampel', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                    placeholder="Batch/ID..."
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="date"
                    value={entry.tanggalSampel}
                    onChange={(e) => handleEntryChange(index, 'tanggalSampel', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="time"
                    value={entry.waktuSelesai}
                    onChange={(e) => handleEntryChange(index, 'waktuSelesai', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.paraf}
                    onChange={(e) => handleEntryChange(index, 'paraf', e.target.value)}
                    className={`w-full text-xs outline-none text-center ${inputBg} ${inputText}`}
                    placeholder="Paraf"
                  />
                </td>
                <td className={`border p-1 ${borderColor}`}>
                  <input
                    type="text"
                    value={entry.catatan}
                    onChange={(e) => handleEntryChange(index, 'catatan', e.target.value)}
                    className={`w-full text-xs outline-none ${inputBg} ${inputText}`}
                    placeholder="Catatan..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center text-xs">
        <div>
          <span className="font-semibold">QR-QC-0001.00 (04 Sep 2019)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ditinjau oleh:</span>
          <div className={`border w-32 h-8 ${borderColor}`}></div>
        </div>
        <div>
          <span>Hal 2 dari 33</span>
        </div>
      </div>
    </div>
  );
}