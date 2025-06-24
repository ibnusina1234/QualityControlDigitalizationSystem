import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, X, Eye, CheckCircle, Clock, FileText, User, Calendar, Package } from 'lucide-react';
import { useSelector } from "react-redux";
import FullCompleteModal from './FullCompleteModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE = process.env.REACT_APP_API_BASE_URL

const RamanDashboard = () => {
      const userRedux = useSelector((state) => state.user.user);
      const inisial = userRedux?.inisial;
      const emailForRequestRaman = (userRedux?.userrole === "admin", userRedux?.jabatan === "SUPERVISOR WH", userRedux?.jabatan === "INSPEKTOR QC");
      const idOperator = userRedux?.id;
      const idInspektor = userRedux?.id;
      const [pages, setPages] = useState('warehouse');
      const [materials, setMaterials] = useState(['']);
      // New states for batch options fetched per material
      const [batchOptions, setBatchOptions] = useState([[]]);
      const [batchNumbers, setBatchNumbers] = useState(['']);
      const [vatCounts, setVatCounts] = useState(['']);
      const [requests, setRequests] = useState([]);
      const [onProgress, setOnProgress] = useState([]);
      const [completed, setCompleted] = useState([]);
      const [showModal, setShowModal] = useState(false);
      const [currentRequest, setCurrentRequest] = useState(null);
      const [showFullComplete, setShowFullComplete] = useState(false);
      const [vatModalOpen, setVatModalOpen] = useState({
            isOpen: false,
            item: null,
            usedVats: []
      });

      // QC Modal states (no batch input on QC view now)
      const [showDetailModal, setShowDetailModal] = useState(false);
      const [selectedComplete, setSelectedComplete] = useState(null);

      // Map batch_number + material_id ke daftar vats yang sudah pernah dipilih
      const [usedVatsByBatch, setUsedVatsByBatch] = useState({}); // { [`batchNumber__materialId`]: [1,2,3] }

      function toLocaleID(dt) {
            if (!dt) return '';
            // Pastikan dt adalah string ISO/UTC
            const date = typeof dt === 'string' ? new Date(dt) : dt;
            // Tambah 7 jam (dalam milidetik)
            const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
            return new Intl.DateTimeFormat('id-ID', {
                  hour12: false,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
            }).format(wib);
      }

      // Fetch all requests, onProgress, completed from API
      const fetchRequests = async () => {
            try {
                  const res = await axios.get(`${API_BASE}/Raman/all-requests`);
                  const all = res.data || [];
                  setRequests(all.filter(r => r.status === 'request').map(r => ({
                        ...r,
                        materials: [r.material],
                        timestamp: r.requested_at,
                        operator: r.operator_name,
                        vatCount: r.vat_count,
                        batch_number: r.batch_number
                  })));
                  setOnProgress(all.filter(r => r.status === 'progress').map(r => ({
                        ...r,
                        materials: [r.material],
                        timestamp: r.requested_at,
                        operator: r.operator_name,
                        vatCount: r.vat_count,
                        processedAt: r.processed_at,
                        inspector: r.inspector_name,
                        selectedVats: r.identified_vats || [],
                        batch_number: r.batch_number,
                        material_id: r.material_id,
                  })));
                  setCompleted(all.filter(r => r.status === 'complete').map(r => ({
                        ...r,
                        materials: [r.material],
                        timestamp: r.requested_at,
                        operator: r.operator_name,
                        vatCount: r.vat_count,
                        processedAt: r.processed_at,
                        completedAt: r.completed_at,
                        inspector: r.inspector_name,
                        selectedVats: r.identified_vats || [],
                        batch_number: r.batch_number,
                        material_id: r.material_id,
                  })));
            } catch (err) {
                  console.error('Gagal mengambil data:', err);
            }
      };

      useEffect(() => {
            fetchRequests();
            // eslint-disable-next-line
      }, []);

      // Add material input (with batch and vat)
      const addMaterial = () => {
            setMaterials([...materials, '']);
            setBatchOptions([...batchOptions, []]);
            setBatchNumbers([...batchNumbers, '']);
            setVatCounts([...vatCounts, '']);
      };

      // Remove material input
      const removeMaterial = (index) => {
            if (materials.length > 1) {
                  setMaterials(materials.filter((_, i) => i !== index));
                  setBatchOptions(batchOptions.filter((_, i) => i !== index));
                  setBatchNumbers(batchNumbers.filter((_, i) => i !== index));
                  setVatCounts(vatCounts.filter((_, i) => i !== index));
            }
      };

      // Update material value
      const updateMaterial = (index, value) => {
            const newMaterials = [...materials];
            newMaterials[index] = value;
            setMaterials(newMaterials);

            // Reset batch options and selections for this material
            const newBatchOptions = [...batchOptions];
            newBatchOptions[index] = [];
            setBatchOptions(newBatchOptions);
            const newBatchNumbers = [...batchNumbers];
            newBatchNumbers[index] = '';
            setBatchNumbers(newBatchNumbers);
            const newVatCounts = [...vatCounts];
            newVatCounts[index] = '';
            setVatCounts(newVatCounts);

            // If value is not empty, fetch batch options
            if (value.trim()) {
                  axios.get(`${API_BASE}/Raman/sheet-batch?material_name=${encodeURIComponent(value.trim())}`)
                        .then(res => {
                              const opts = res.data || [];
                              const batchOptsCopy = [...batchOptions];
                              batchOptsCopy[index] = opts;
                              setBatchOptions(batchOptsCopy);

                              // If any batch is found, preselect the first one and set vat_count
                              if (opts.length) {
                                    const batchNumsCopy = [...batchNumbers];
                                    batchNumsCopy[index] = opts[0].batch_number;
                                    setBatchNumbers(batchNumsCopy);

                                    const vatCountsCopy = [...vatCounts];
                                    vatCountsCopy[index] = opts[0].vat_count;
                                    setVatCounts(vatCountsCopy);
                              }
                        })
                        .catch(() => {
                              // If fetch fails, reset options
                              const batchOptsCopy = [...batchOptions];
                              batchOptsCopy[index] = [];
                              setBatchOptions(batchOptsCopy);
                        });
            }
      };

      // Handle batch dropdown change: update batch_number and vat_count
      const handleBatchChange = (index, value) => {
            setBatchNumbers(prev => {
                  const arr = [...prev];
                  arr[index] = value;
                  return arr;
            });
            // Set vat_count from batchOptions if found, else empty string
            const found = (batchOptions[index] || []).find(b => b.batch_number === value);
            setVatCounts(prev => {
                  const arr = [...prev];
                  arr[index] = found ? found.vat_count : '';
                  return arr;
            });
      };

      // Allow manual vat_count if no batch matched, or user wants to override
      const handleVatCountInput = (index, value) => {
            setVatCounts(prev => {
                  const arr = [...prev];
                  arr[index] = value;
                  return arr;
            });
      };

      // Allow manual batch_number entry
      const handleBatchNumberInput = (index, value) => {
            setBatchNumbers(prev => {
                  const arr = [...prev];
                  arr[index] = value;
                  return arr;
            });
            // If manual batch entered, clear vat_count if batch doesn't exist on list
            const found = (batchOptions[index] || []).find(b => b.batch_number === value);
            setVatCounts(prev => {
                  const arr = [...prev];
                  arr[index] = found ? found.vat_count : '';
                  return arr;
            });
      };

      // Call inspector: kirim batch_number & vat_count hasil dropdown/manual
      const callInspector = async () => {
            const requestsToSend = materials
                  .map((m, i) => ({
                        material: m,
                        batch_number: batchNumbers[i],
                        vat_count: vatCounts[i]
                  }))
                  .filter(x => x.material.trim() && x.batch_number && x.vat_count && !isNaN(Number(x.vat_count)));

            if (requestsToSend.length === 0 || !inisial) return;

            try {
                  await Promise.all(
                        requestsToSend.map(data =>
                              axios.post(`${API_BASE}/Raman/request`, {
                                    material_name: data.material,
                                    operator_id: idOperator,
                                    batch_number: data.batch_number,
                                    vat_count: Number(data.vat_count),
                                    requested_at: new Date(new Date().toISOString()) // ensure UTC
                              })
                        )
                  );
                  // Kirim Telegram setelah request
                  try {
                        // Susun pesan Telegram dari semua request yang dikirim
                        let pesanTelegram = `📦 <b>Request Raman Baru</b>\n`;
                        pesanTelegram += `Operator: <b>${inisial}</b>\n`;
                        requestsToSend.forEach((req, idx) => {
                              pesanTelegram += `\n<b>Material ${idx + 1}:</b> ${req.material}\nBatch: <b>${req.batch_number}</b>\nJumlah Vat: <b>${req.vat_count}</b>\n`;
                        });
                        pesanTelegram += `\nWaktu: ${(new Date())}`;;

                        await axios.post(`${API_BASE}/bot/telegram/send`, {
                              message: pesanTelegram
                              // chat_id: bisa ditambah jika mau override
                        });
                  } catch (err) {
                        // Optional: alert jika gagal kirim Telegram
                        // alert('Gagal mengirim notifikasi Telegram');
                  }

                  setMaterials(['']);
                  setBatchOptions([[]]);
                  setBatchNumbers(['']);
                  setVatCounts(['']);
                  fetchRequests();
                  alert('Request berhasil dikirim ke QC Inspector!');
            } catch (err) {
                  if (err.response && err.response.data) {
                        alert(err.response.data.message || JSON.stringify(err.response.data));
                  } else {
                        alert('Gagal mengirim request');
                  }
            }
      };

      // Helper: total vat identified for batch
      const getTotalIdentifiedForBatch = (batch_number, material_id) => {
            let vats = new Set();
            completed.forEach(item => {
                  if (item.batch_number === batch_number && item.material_id === material_id && item.selectedVats) {
                        item.selectedVats.forEach(v => vats.add(v));
                  }
            });
            onProgress.forEach(item => {
                  if (item.batch_number === batch_number && item.material_id === material_id && item.selectedVats) {
                        item.selectedVats.forEach(v => vats.add(v));
                  }
            });
            return vats.size;
      };

      // Fetch daftar used vats untuk batch tertentu
      const fetchUsedVats = useCallback(async (batchNumber, materialId) => {
            if (!batchNumber || !materialId) return [];
            try {
                  const res = await axios.get(`${API_BASE}/Raman/batches/${encodeURIComponent(batchNumber)}/used-vats?material_id=${materialId}`);
                  return res.data || [];
            } catch {
                  return [];
            }
      }, []);

      // Set used vats untuk setiap batch_number + material_id pada onProgress dan completed
      useEffect(() => {
            const uniqueBatches = {};
            onProgress.forEach(item => {
                  if (item.batch_number && item.material_id) {
                        uniqueBatches[`${item.batch_number}__${item.material_id}`] = { batchNumber: item.batch_number, materialId: item.material_id };
                  }
            });
            completed.forEach(item => {
                  if (item.batch_number && item.material_id) {
                        uniqueBatches[`${item.batch_number}__${item.material_id}`] = { batchNumber: item.batch_number, materialId: item.material_id };
                  }
            });
            Promise.all(Object.values(uniqueBatches).map(async ({ batchNumber, materialId }) => {
                  const vats = await fetchUsedVats(batchNumber, materialId);
                  return { batchNumber, materialId, vats };
            })).then(results => {
                  const newUsedVatsByBatch = {};
                  results.forEach(({ batchNumber, materialId, vats }) => {
                        newUsedVatsByBatch[`${batchNumber}__${materialId}`] = vats;
                  });
                  setUsedVatsByBatch(newUsedVatsByBatch);
            });
      }, [onProgress, completed, fetchUsedVats]);

      // QC: Process request to on progress (assign inspector only)
      const processRequest = async () => {
            if (!currentRequest || !idInspektor) return;

            try {
                  const body = {
                        inspector_id: idInspektor,
                        processed_at: new Date(new Date().toISOString()) // ensure UTC
                  };

                  await axios.patch(`${API_BASE}/Raman/request/${currentRequest.id}/progress`, body);

                  // Kirim notifikasi Telegram
                  const datetime = new Date().toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                  });

                  const pesanTelegram =
                        `🔍<b>Accept Request Identification</b>\n` +
                        `Material: <b>${currentRequest.material}</b>\n` +
                        `Batch: <b>${currentRequest.batch_number}</b>\n` +
                        `Accept by: <b>${inisial}</b>\n` +
                        `Datetime: ${datetime}`;

                  await axios.post(`${API_BASE}/bot/telegram/send`, {
                        message: pesanTelegram,
                  });

                  setShowModal(false);
                  fetchRequests();
            } catch (err) {
                  if (err.response && err.response.data) {
                        alert(err.response.data.message || JSON.stringify(err.response.data));
                  } else {
                        alert("Gagal memproses request");
                  }
            }
      };





      // Toggle vat selection (QC) - tidak bisa pilih kalau sudah pernah dipilih di batch yang sama
      const toggleVat = (requestId, vatNumber, batchNumber, materialId) => {
            const usedVats = usedVatsByBatch[`${batchNumber}__${materialId}`] || [];
            if (usedVats.includes(vatNumber)) return;
            setOnProgress(prevProgress =>
                  prevProgress.map(item => {
                        if (item.id === requestId) {
                              const currentSelected = item.selectedVats || [];
                              const isSelected = currentSelected.includes(vatNumber);
                              return {
                                    ...item,
                                    selectedVats: isSelected
                                          ? currentSelected.filter(v => v !== vatNumber)
                                          : [...currentSelected, vatNumber]
                              };
                        }
                        return item;
                  })
            );
      };

      // Submit progress to complete (QC)
      const submitProgress = async (request) => {
            try {
                  // Simpan vat yang diidentifikasi
                  await axios.post(`${API_BASE}/Raman/request/${request.id}/vats`, {
                        vats: request.selectedVats
                  });

                  // Tandai complete
                  await axios.patch(`${API_BASE}/Raman/request/${request.id}/complete`, {
                        completed_at: new Date(new Date().toISOString()) // UTC
                  });

                  // Refresh permintaan
                  await fetchRequests();

                  // Refresh used vats cache
                  if (request.batch_number && request.material_id) {
                        const vats = await fetchUsedVats(request.batch_number, request.material_id);
                        setUsedVatsByBatch(prev => ({
                              ...prev,
                              [`${request.batch_number}__${request.material_id}`]: vats
                        }));
                  }

                  // --- Kirim Telegram ---
                  const datetime = new Date().toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                  });

                  const jumlahVat = request.selectedVats?.length || 0;
                  const totalVat = request.vatCount || "-";

                  const listVat = request.selectedVats?.map(v => `• ${v}`).join("\n") || "-";

                  const pesanTelegram =
                        `✅ <b>Material Identification Request Completed</b>\n` +
                        `Material: <b>${request.material}</b>\n` +
                        `Batch: <b>${request.batch_number}</b>\n` +
                        `Identified Vats:\n${listVat}\n` +
                        `Identified Count: ${jumlahVat} of ${totalVat}\n` +
                        `Raman by: <b>${inisial}</b>\n` +
                        `Datetime: ${datetime}`;


                  await axios.post(`${API_BASE}/bot/telegram/send`, {
                        message: pesanTelegram,
                  });

            } catch (err) {
                  alert("Gagal submit");
                  console.error(err);
            }
      };



      // Show complete detail
      const showCompleteDetail = (item) => {
            setSelectedComplete(item);
            setShowDetailModal(true);
      };

      const StatCard = ({ title, count, color, icon: Icon }) => (
            <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-6 hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between">
                        <div>
                              <p className="text-sm font-medium text-gray-600">{title}</p>
                              <p className="text-3xl font-bold text-gray-900">{count}</p>
                        </div>
                        <Icon className="h-8 w-8 text-gray-400" />
                  </div>
            </div>
      );

      if (pages === 'warehouse') {
            return (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 mt-20">
                        <div className="w-full">
                              {/* Header */}
                              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <h1 className="text-3xl font-bold text-gray-900">Dashboard Warehouse</h1>
                                                <p className="text-gray-600 mt-1">Identifikasi Raman - Request Material</p>
                                          </div>
                                          <button
                                                onClick={() => setPages('QC')}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                          >
                                                Switch to QC View
                                          </button>
                                    </div>
                              </div>
                              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    {/* Material Input Section - Spans 2 columns on xl screens */}
                                    <div className="xl:col-span-2">
                                          <div className="bg-white rounded-xl shadow-sm p-6 h-full">
                                                <div className="flex items-center mb-6">
                                                      <Package className="h-6 w-6 text-indigo-600 mr-3" />
                                                      <h2 className="text-xl font-semibold text-gray-900">Input Material untuk Identifikasi Raman</h2>
                                                </div>
                                                {/* Operator Name Input */}
                                                <div className="mb-6">
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Nama Operator Warehouse
                                                      </label>
                                                      <input
                                                            type="text"
                                                            value={inisial}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                            readOnly
                                                      />
                                                </div>
                                                <div className="space-y-4">
                                                      {materials.map((material, idx) => (
                                                            <div key={idx} className="flex items-center space-x-3">
                                                                  <div className="flex-1">
                                                                        <select
                                                                              value={material}
                                                                              onChange={(e) => updateMaterial(idx, e.target.value)}
                                                                              className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                                        >
                                                                              <option value="">Pilih Material</option>
                                                                              <option value="MAGNESIUM STEARAT">MAGNESIUM STEARAT</option>
                                                                              <option value="TALCUM">TALCUM</option>
                                                                              <option value="CORN STARCH">CORN STARCH</option>
                                                                        </select>
                                                                        {/* Dropdown batch jika ada, dan input manual */}
                                                                        <div className="flex space-x-2 items-center">
                                                                              <select
                                                                                    className="w-1/2 px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                                    value={
                                                                                          // Show "" if not in list, so manual input is prioritized
                                                                                          (batchOptions[idx] || []).some(b => b.batch_number === batchNumbers[idx])
                                                                                                ? batchNumbers[idx]
                                                                                                : ""
                                                                                    }
                                                                                    onChange={e => handleBatchChange(idx, e.target.value)}
                                                                                    disabled={!batchOptions[idx] || batchOptions[idx].length === 0}
                                                                              >
                                                                                    <option value="">Pilih Batch</option>
                                                                                    {(batchOptions[idx] || []).map(b => (
                                                                                          <option key={b.batch_number} value={b.batch_number}>
                                                                                                {b.batch_number}
                                                                                          </option>
                                                                                    ))}
                                                                              </select>
                                                                              <input
                                                                                    className="w-1/2 px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                                    type="text"
                                                                                    placeholder="Input Manual Batch"
                                                                                    value={batchNumbers[idx]}
                                                                                    onChange={e => handleBatchNumberInput(idx, e.target.value)}
                                                                              />
                                                                        </div>
                                                                        {/* Input vat_count, readonly jika batch dipilih dari dropdown, bisa diisi manual jika tidak */}
                                                                        <input
                                                                              type="number"
                                                                              min="1"
                                                                              max="100"
                                                                              value={vatCounts[idx]}
                                                                              onChange={e => handleVatCountInput(idx, e.target.value)}
                                                                              placeholder="Jumlah Vat"
                                                                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                                              readOnly={
                                                                                    (batchOptions[idx] || []).some(b => b.batch_number === batchNumbers[idx])
                                                                              }
                                                                        />
                                                                        {(!batchOptions[idx] || batchOptions[idx].length === 0) &&
                                                                              <p className="text-xs text-yellow-500 mt-1">Tidak ada batch "Pending" untuk material ini, silakan input manual.</p>
                                                                        }
                                                                  </div>
                                                                  {materials.length > 1 && (
                                                                        <button
                                                                              onClick={() => removeMaterial(idx)}
                                                                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        >
                                                                              <X className="h-5 w-5" />
                                                                        </button>
                                                                  )}
                                                            </div>
                                                      ))}
                                                </div>
                                                <div className="flex items-center justify-between mt-6">
                                                      <button
                                                            onClick={addMaterial}
                                                            className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                                                      >
                                                            <Plus className="h-5 w-5 mr-2" />
                                                            Tambah Material
                                                      </button>
                                                      <button
                                                            onClick={callInspector}
                                                            disabled={materials.every((m, i) =>
                                                                  m.trim() === '' || !batchNumbers[i] || !vatCounts[i] || isNaN(Number(vatCounts[i]))
                                                            ) || !inisial}
                                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                                      >
                                                            Call Inspector QC
                                                      </button>
                                                </div>
                                          </div>
                                    </div>
                                    <div className="xl:col-span-1">
                                          {requests.length > 0 && (
                                                <div className="bg-white rounded-xl shadow-sm p-6 h-full">
                                                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Permintaan Terkirim</h3>
                                                      <div className="space-y-3 max-h-96 overflow-y-auto">
                                                            {requests.map((request) => (
                                                                  <div
                                                                        key={request.id}
                                                                        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg relative"
                                                                  >
                                                                        {/* Tombol Delete di pojok kanan atas */}
                                                                        <button
                                                                              onClick={async () => {
                                                                                    if (window.confirm("Hapus permintaan ini?")) {
                                                                                          try {
                                                                                                await axios.delete(`${API_BASE}/Raman/request/${request.id}`);
                                                                                                fetchRequests();
                                                                                          } catch (err) {
                                                                                                alert("Gagal menghapus permintaan");
                                                                                          }
                                                                                    }
                                                                              }}
                                                                              className="absolute top-2 right-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs"
                                                                              title="Hapus Permintaan"
                                                                        >
                                                                              Hapus
                                                                        </button>
                                                                        <div className="flex-1">
                                                                              <p className="font-medium text-gray-900 text-sm">
                                                                                    Material: {request.materials.join(', ')}
                                                                              </p>
                                                                              <p className="text-xs text-gray-600 mt-1">
                                                                                    Operator: {request.operator}
                                                                              </p>
                                                                              <p className="text-xs text-gray-600">
                                                                                    Batch: {request.batch_number}
                                                                              </p>
                                                                              <p className="text-xs text-gray-600">
                                                                                    Jumlah Vat: {request.vatCount}
                                                                              </p>
                                                                              <p className="text-xs text-gray-600">
                                                                                    Dikirim: {toLocaleID(request.timestamp)}
                                                                              </p>
                                                                        </div>
                                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium ml-2 absolute bottom-2 right-2">
                                                                              Menunggu QC
                                                                        </span>
                                                                  </div>
                                                            ))}
                                                      </div>
                                                </div>
                                          )}
                                    </div>
                              </div>
                        </div>
                  </div>
            );
      }

      return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6 mt-20">
                  <div className="w-full">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                              <div className="flex items-center justify-between">
                                    <div>
                                          <h1 className="text-3xl font-bold text-gray-900">Dashboard QC Inspector</h1>
                                          <p className="text-gray-600 mt-1">Monitoring Identifikasi Raman</p>
                                    </div>
                                    <button
                                          onClick={() => setPages('warehouse')}
                                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                          Switch to Warehouse View
                                    </button>
                              </div>
                        </div>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
                              <div className="xl:col-span-2">
                                    <StatCard title="Request Raman" count={requests.length} color="border-yellow-500" icon={Clock} />
                              </div>
                              <div className="xl:col-span-2">
                                    <StatCard title="On Progress" count={onProgress.length} color="border-blue-500" icon={Eye} />
                              </div>
                              <div className="xl:col-span-2">
                                    <StatCard title="Complete" count={completed.length} color="border-green-500" icon={CheckCircle} />
                              </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                              {/* Request Raman */}
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center mb-4">
                                          <Clock className="h-6 w-6 text-yellow-600 mr-3" />
                                          <h2 className="text-xl font-semibold text-gray-900">Request Raman</h2>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                          {requests.map((request) => (
                                                <div
                                                      key={request.id}
                                                      onClick={() => {
                                                            setCurrentRequest(request);
                                                            setShowModal(true);
                                                      }}
                                                      className="p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors"
                                                >
                                                      <p className="font-medium text-gray-900 text-sm">
                                                            {request.materials.join(', ')}
                                                      </p>
                                                      <p className="text-sm text-blue-600 font-medium mt-1">
                                                            Operator: {request.operator}
                                                      </p>
                                                      <p className="text-xs text-gray-600 mt-1">
                                                            Batch: {request.batch_number}
                                                      </p>
                                                      <p className="text-xs text-gray-600">
                                                            Jumlah Vat: {request.vatCount}
                                                      </p>
                                                      <p className="text-xs text-gray-600 mt-1">
                                                            {toLocaleID(request.timestamp)}
                                                      </p>
                                                </div>
                                          ))}
                                          {requests.length === 0 && (
                                                <p className="text-gray-500 text-center py-8">Tidak ada request</p>
                                          )}
                                    </div>
                              </div>
                              {/* On Progress */}
                              <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center mb-4">
                                          <Eye className="h-6 w-6 text-blue-600 mr-3" />
                                          <h2 className="text-xl font-semibold text-gray-900">On Progress</h2>
                                    </div>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                          {onProgress.map((item) => {
                                                const usedVats = usedVatsByBatch[`${item.batch_number}__${item.material_id}`] || [];
                                                return (
                                                      <div key={item.id} className="p-4 border border-gray-200 rounded-lg relative">
                                                            {/* Tombol Delete pojok kanan atas */}
                                                            <button
                                                                  onClick={async () => {
                                                                        if (window.confirm("Hapus request ini?")) {
                                                                              try {
                                                                                    await axios.delete(`${API_BASE}/Raman/request/${item.id}`);
                                                                                    fetchRequests();
                                                                              } catch (err) {
                                                                                    alert("Gagal hapus request");
                                                                              }
                                                                        }
                                                                  }}
                                                                  className="absolute top-2 right-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs"
                                                                  title="Hapus Request"
                                                            >
                                                                  Delete
                                                            </button>
                                                            <p className="font-medium text-gray-900 mb-2 text-sm">
                                                                  {item.materials.join(', ')}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mb-1">
                                                                  Vat: {item.vatCount}
                                                            </p>
                                                            <p className="text-xs text-blue-600 font-medium mb-3">
                                                                  Operator: {item.operator}
                                                            </p>
                                                            {/* Batch number */}
                                                            <p className="text-xs text-purple-600 font-medium mb-2">
                                                                  Batch: {item.batch_number || '-'}
                                                            </p>

                                                            {/* Selected Vats Display */}
                                                            <div className="mb-3">
                                                                  <p className="text-xs text-gray-600 mb-1">Selected Vats:</p>
                                                                  <p className="text-sm font-medium text-green-600">
                                                                        {item.selectedVats && item.selectedVats.length > 0
                                                                              ? item.selectedVats.map(vat => `Vat ${vat}`).join(', ')
                                                                              : 'None selected'
                                                                        }
                                                                  </p>
                                                            </div>

                                                            {/* Button to open modal */}
                                                            <button
                                                                  onClick={() => setVatModalOpen({
                                                                        isOpen: true,
                                                                        item: item,
                                                                        usedVats: usedVats
                                                                  })}
                                                                  className="w-full px-4 py-2 mb-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                                                            >
                                                                  Select Vats ({item.selectedVats?.length || 0}/{item.vatCount})
                                                            </button>

                                                            <button
                                                                  onClick={() => submitProgress(item)}
                                                                  disabled={!item.selectedVats || item.selectedVats.length === 0}
                                                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                                                            >
                                                                  Submit
                                                            </button>
                                                      </div>
                                                );
                                          })}
                                          {onProgress.length === 0 && (
                                                <p className="text-gray-500 text-center py-8">Tidak ada progress</p>
                                          )}
                                    </div>
                              </div>

                              {/* Vat Selection Modal */}
                              {vatModalOpen.isOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                                                <div className="flex justify-between items-center mb-4">
                                                      <h3 className="text-lg font-semibold text-gray-900">Select Vats</h3>
                                                      <button
                                                            onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                            className="text-gray-500 hover:text-gray-700"
                                                      >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                      </button>
                                                </div>

                                                <div className="mb-4">
                                                      <p className="text-sm text-gray-600">Material: {vatModalOpen.item?.materials.join(', ')}</p>
                                                      <p className="text-sm text-gray-600">Batch: {vatModalOpen.item?.batch_number || '-'}</p>
                                                      <p className="text-sm text-gray-600">Total Vats: {vatModalOpen.item?.vatCount}</p>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 mb-4">
                                                      {Array.from({ length: vatModalOpen.item?.vatCount || 0 }, (_, i) => i + 1).map(vatNum => {
                                                            const isUsed = vatModalOpen.usedVats.includes(vatNum);
                                                            const isSelected = (vatModalOpen.item?.selectedVats || []).includes(vatNum);
                                                            return (
                                                                  <button
                                                                        key={vatNum}
                                                                        onClick={() => toggleVat(vatModalOpen.item.id, vatNum, vatModalOpen.item.batch_number, vatModalOpen.item.material_id)}
                                                                        disabled={isUsed}
                                                                        className={`p-3 text-sm rounded-lg border-2 transition-all
                ${isSelected
                                                                                    ? 'bg-green-100 border-green-500 text-green-700'
                                                                                    : isUsed
                                                                                          ? 'bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed'
                                                                                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                                                              }`}
                                                                  >
                                                                        Vat {vatNum}
                                                                  </button>
                                                            );
                                                      })}
                                                </div>

                                                <div className="flex gap-2">
                                                      <button
                                                            onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                                      >
                                                            Cancel
                                                      </button>
                                                      <button
                                                            onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                      >
                                                            Done
                                                      </button>
                                                </div>
                                          </div>
                                    </div>
                              )}
                              {/* Complete */}
                              {/* Complete */}
                              <div className="bg-white rounded-xl shadow-sm p-6 relative">
                                    <div className="flex items-center mb-4">
                                          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                                          <h2 className="text-xl font-semibold text-gray-900">Complete</h2>
                                          <button
                                                onClick={() => setShowFullComplete(true)}
                                                className="ml-auto px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs"
                                          >
                                                Full View
                                          </button>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                          {[...completed]
                                                .slice(-10) // Ambil 10 data terakhir
                                                .reverse()  // Opsional: agar urutannya dari yang terbaru ke terlama
                                                .map((item) => (
                                                      <div
                                                            key={item.id}
                                                            onClick={() => showCompleteDetail(item)}
                                                            className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                                                      >
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                  {item.materials.join(', ')}
                                                            </p>
                                                            <p className="text-xs text-purple-600 font-medium">
                                                                  Batch: {item.batch_number || '-'}
                                                            </p>
                                                            <p className="text-xs text-green-600 font-medium">
                                                                  Vat: {getTotalIdentifiedForBatch(item.batch_number, item.material_id)} of {item.vatCount} identified
                                                            </p>
                                                            <p className="text-xs text-blue-600 font-medium">
                                                                  Operator: {item.operator}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                  {item.completedAt ? dayjs(item.completedAt).add(7, 'hour').format('DD MMM YYYY HH:mm:ss') : ''}
                                                            </p>
                                                            <p
                                                                  className={
                                                                        getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                                                              ? 'text-green-800 bg-green-100 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                              : 'text-yellow-800 bg-yellow-100 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                  }
                                                            >
                                                                  Progress: {
                                                                        getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                                                              ? 'Completed Raman'
                                                                              : 'On-progress Raman'
                                                                  }
                                                            </p>
                                                      </div>
                                                ))}
                                    </div>
                                    {/* Full Complete Modal */}
                                    {showFullComplete && (
                                          <FullCompleteModal
                                                completes={completed}
                                                getTotalIdentifiedForBatch={getTotalIdentifiedForBatch}
                                                onClose={() => setShowFullComplete(false)}
                                          />
                                    )}
                              </div>
                        </div>
                        {/* Request Modal for QC */}
                        {showModal && currentRequest && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                                          <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                                Process Request
                                          </h3>
                                          <div className="space-y-4">
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Materials:
                                                      </label>
                                                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                            {currentRequest?.materials.join(', ')}
                                                      </p>
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Operator:
                                                      </label>
                                                      <p className="text-blue-600 font-medium bg-blue-50 p-3 rounded-lg">
                                                            {currentRequest?.operator}
                                                      </p>
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Batch Number:
                                                      </label>
                                                      <p className="text-purple-800 font-bold bg-gray-50 p-3 rounded-lg">
                                                            {currentRequest?.batch_number || '-'}
                                                      </p>
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Jumlah Vat:
                                                      </label>
                                                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                            {currentRequest?.vatCount || '-'}
                                                      </p>
                                                </div>
                                          </div>
                                          <div className="flex space-x-3 mt-6">
                                                <button
                                                      onClick={() => setShowModal(false)}
                                                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                      Cancel
                                                </button>
                                                <button
                                                      onClick={processRequest}
                                                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                      Next
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        )}

                        {/* Complete Detail Modal */}
                        {showDetailModal && selectedComplete && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                                          <div className="flex items-center mb-4">
                                                <FileText className="h-6 w-6 text-green-600 mr-3" />
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                      Detail Complete
                                                </h3>
                                          </div>
                                          <div className="space-y-4">
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Materials:
                                                      </label>
                                                      <p className="text-gray-900">{selectedComplete.materials.join(', ')}</p>
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Batch Number:
                                                      </label>
                                                      <p className="text-purple-800 font-bold">{selectedComplete.batch_number || '-'}</p>
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Vat Teridentifikasi:
                                                      </label>
                                                      <div className="flex items-center space-x-2">
                                                            <span className="text-lg font-bold text-green-600">
                                                                  {getTotalIdentifiedForBatch(selectedComplete.batch_number, selectedComplete.material_id)}
                                                            </span>
                                                            <span className="text-gray-500">of</span>
                                                            <span className="text-lg font-bold text-gray-900">
                                                                  {selectedComplete.vatCount}
                                                            </span>
                                                            <span className="text-gray-500">vat</span>
                                                      </div>
                                                      {selectedComplete.selectedVats && selectedComplete.selectedVats.length > 0 && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                  Vat yang teridentifikasi pada request ini: {selectedComplete.selectedVats.sort((a, b) => a - b).join(', ')}
                                                            </p>
                                                      )}
                                                </div>
                                                <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Operator Warehouse:
                                                      </label>
                                                      <p className="text-blue-600 font-medium">{selectedComplete.operator}</p>
                                                </div>
                                                <div className="flex items-center">
                                                      <User className="h-4 w-4 text-gray-500 mr-2" />
                                                      <span className="text-sm text-gray-600">
                                                            QC Inspector: {selectedComplete.inspector}
                                                      </span>
                                                </div>
                                                <div className="flex items-center">
                                                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                                      <span className="text-sm text-gray-600">
                                                            Selesai: {selectedComplete.completedAt ? dayjs(selectedComplete.completedAt).add(7, 'hour').format('DD MMM YYYY HH:mm:ss') : ''}
                                                      </span>
                                                </div>
                                          </div>
                                          <button
                                                onClick={() => setShowDetailModal(false)}
                                                className="w-full mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                          >
                                                Close
                                          </button>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
};

export default RamanDashboard;