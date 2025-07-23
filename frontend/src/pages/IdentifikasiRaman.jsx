import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, X, Eye, CheckCircle, Clock, FileText, User, Calendar, Package } from 'lucide-react';
import { useSelector } from "react-redux";
import FullCompleteModal from './FullCompleteModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import DeleteWithNotesModal from '../components/DeleteWithNotesModal';
import { useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@chakra-ui/react';

dayjs.extend(utc);
dayjs.extend(timezone);
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const RamanDashboard = () => {
      const userRedux = useSelector((state) => state.user.user);
      const inisial = userRedux?.inisial;
      const emailForRequestRaman = (userRedux?.userrole === "admin", userRedux?.jabatan === "SUPERVISOR WH" || userRedux?.jabatan === "INSPEKTOR QC");
      const idOperator = userRedux?.id;
      const idInspektor = userRedux?.id;
      const isAdminAndInspektor = (
            userRedux?.userrole === "admin" ||
            userRedux?.userrole === "super admin" ||
            userRedux?.jabatan === "INSPEKTOR QC"
      );
      const isAdmin = userRedux?.userrole === "admin" || userRedux?.userrole === "super admin";

      // For modal delete
      const [deleteModalOpen, setDeleteModalOpen] = useState(false);
      const [deleteTarget, setDeleteTarget] = useState(null); // request/onProgress item
      const [deleteLoading, setDeleteLoading] = useState(false);
      const [deleteType, setDeleteType] = useState(""); // "request" or "progress"

      // State for modal editComplete
      const [showEditCompleteModal, setShowEditCompleteModal] = useState(false);
      const [editCompleteTarget, setEditCompleteTarget] = useState(null);
      const [editSelectedVats, setEditSelectedVats] = useState([]);
      const [editNotes, setEditNotes] = useState('');
      const [editLoading, setEditLoading] = useState(false);

      const [pages, setPages] = useState('warehouse');
      const [materials, setMaterials] = useState(['']);
      const [batchOptions, setBatchOptions] = useState([[]]);
      const [batchNumbers, setBatchNumbers] = useState(['']);
      const [vatCounts, setVatCounts] = useState(['']);
      const [tanggalTimbang, setTanggalTimbang] = useState(['']);
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

      // QC Modal states
      const [showDetailModal, setShowDetailModal] = useState(false);
      const [selectedComplete, setSelectedComplete] = useState(null);

      // Map batch_number + material_id to the list of vats that have been selected
      const [usedVatsByBatch, setUsedVatsByBatch] = useState({});

      // ----- DARK/LIGHT MODE THEME -----
      const bgMain = useColorModeValue("bg-gradient-to-br from-blue-50 to-indigo-100", "bg-gradient-to-br from-gray-900 to-blue-950");
      const bgMainQC = useColorModeValue("bg-gradient-to-br from-purple-50 to-pink-100", "bg-gradient-to-br from-gray-900 to-purple-950");
      const cardBg = useColorModeValue("bg-white", "bg-gray-800");
      const cardShadow = useColorModeValue("shadow-sm", "shadow-md");
      const textMain = useColorModeValue("text-gray-900", "text-gray-100");
      const textSecondary = useColorModeValue("text-gray-600", "text-gray-400");
      const borderColor = useColorModeValue("border-gray-200", "border-gray-700");
      const borderInput = useColorModeValue("border-gray-300", "border-gray-600");
      const inputBg = useColorModeValue("bg-white", "bg-gray-900");
      const inputText = useColorModeValue("text-gray-900", "text-gray-100");
      const btnPrimary = useColorModeValue("bg-indigo-600 hover:bg-indigo-700", "bg-indigo-700 hover:bg-indigo-800");
      const btnPrimaryQC = useColorModeValue("bg-purple-600 hover:bg-purple-700", "bg-purple-700 hover:bg-purple-800");
      const btnSecondary = useColorModeValue("bg-gray-100 hover:bg-gray-200", "bg-gray-800 hover:bg-gray-700");
      const bgHighlight = useColorModeValue("bg-yellow-50", "bg-yellow-900/40");
      const borderHighlight = useColorModeValue("border-yellow-200", "border-yellow-600");
      const bgDelete = useColorModeValue("bg-red-500 hover:bg-red-600", "bg-red-700 hover:bg-red-800");
      const modalOverlay = useColorModeValue("bg-black bg-opacity-50", "bg-black bg-opacity-60");
      const bgModal = useColorModeValue("bg-white", "bg-gray-800");
      const modalText = useColorModeValue("text-gray-900", "text-gray-200");
      const modalInput = useColorModeValue("bg-gray-50", "bg-gray-700");
      const tableHover = useColorModeValue("hover:bg-gray-50", "hover:bg-gray-700/40");
      // ---------------------------------

      const toLocaleID = (dt) => {
            if (!dt) return '';
            const date = typeof dt === 'string' ? new Date(dt) : dt;
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
      };

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
      }, []);

      // Add material input (with batch and vat)
      const addMaterial = () => {
            setMaterials([...materials, '']);
            setBatchOptions([...batchOptions, []]);
            setBatchNumbers([...batchNumbers, '']);
            setVatCounts([...vatCounts, '']);
            setTanggalTimbang([...tanggalTimbang, '']);
      };

      // Remove material input
      const removeMaterial = (index) => {
            if (materials.length > 1) {
                  setMaterials(materials.filter((_, i) => i !== index));
                  setBatchOptions(batchOptions.filter((_, i) => i !== index));
                  setBatchNumbers(batchNumbers.filter((_, i) => i !== index));
                  setVatCounts(vatCounts.filter((_, i) => i !== index));
                  setTanggalTimbang(tanggalTimbang.filter((_, i) => i !== index));
            }
      };

      // Handle edit complete
      const handleEditComplete = async (id, vats, notes) => {
            setEditLoading(true);
            try {
                  const res = await axios.patch(
                        `${API_BASE}/Raman/request/${id}/edit-complete`,
                        {
                              selectedVats: vats,
                              notes: notes
                        },
                        { withCredentials: true } // Penting jika otentikasi JWT pakai cookie
                  );
                  setShowEditCompleteModal(false);
                  setEditCompleteTarget(null);
                  setEditSelectedVats([]);
                  setEditNotes('');
                  await fetchRequests(); // Pastikan fetchRequests menunggu selesai
                  alert("Data complete berhasil diubah.");
            } catch (err) {
                  // Tampilkan pesan error detail jika ada respons dari backend
                  if (err.response && err.response.data && err.response.data.message) {
                        alert("Gagal edit data complete: " + err.response.data.message);
                  } else {
                        alert("Gagal edit data complete");
                  }
            }
            setEditLoading(false);
      };

      // Show delete modal
      const handleShowDeleteModal = (item, type) => {
            setDeleteTarget(item);
            setDeleteType(type); // "request" or "progress"
            setDeleteModalOpen(true);
      };

      // Confirm delete
      const handleDeleteConfirm = async (notes) => {
            setDeleteLoading(true);
            try {
                  await axios.delete(
                        `${API_BASE}/Raman/request/${deleteTarget.id}`,
                        {
                              data: { notes, type: deleteType },
                              withCredentials: true // tambahkan di sini
                        }
                  );
                  fetchRequests();
                  setDeleteModalOpen(false);
                  setDeleteTarget(null);
                  setDeleteType("");
            } catch (err) {
                  alert("Gagal menghapus permintaan");
            }
            setDeleteLoading(false);
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

      // Handle batch dropdown change
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

      // Call inspector: send batch_number & vat_count from dropdown/manual
      const createRequest = async () => {
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
                        requestsToSend.map((data) =>
                              axios.post(`${API_BASE}/Raman/request`, {
                                    material_name: data.material,
                                    operator_id: idOperator,
                                    batch_number: data.batch_number,
                                    vat_count: Number(data.vat_count),
                                    requested_at: new Date(new Date().toISOString())
                              })
                        )
                  );

                  // Send to Python TTS
                  try {
                        await axios.post('http://10.126.15.208:5005/speak', {
                              inisial,
                              requests: requestsToSend
                        });
                  } catch (ttsErr) {
                        console.error('Gagal kirim ke TTS:', ttsErr.message);
                  }

                  // Send Telegram notification
                  try {
                        let pesanTelegram = `📦 <b>Request Raman Baru</b>\n`;
                        pesanTelegram += `Created By: <b>${inisial}</b>\n`;
                        requestsToSend.forEach((req, idx) => {
                              pesanTelegram += `\n<b>Material ${idx + 1}:</b> ${req.material}\nBatch: <b>${req.batch_number}</b>\nJumlah Vat: <b>${req.vat_count}</b>\n`;
                        });
                        pesanTelegram += `\nWaktu: ${(new Date())}`;

                        await axios.post(`${API_BASE}/bot/telegram/send`, {
                              message: pesanTelegram
                        });
                  } catch (err) {
                        console.warn('Gagal kirim ke Telegram:', err.message);
                  }

                  // Reset form
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

      const fetchUsedVats = useCallback(async (batchNumber, materialId) => {
            if (!batchNumber || !materialId) return [];
            try {
                  const res = await axios.get(`${API_BASE}/Raman/batches/${encodeURIComponent(batchNumber)}/used-vats?material_id=${materialId}`);
                  return res.data || [];
            } catch {
                  return [];
            }
      }, []);

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
                        processed_at: new Date().toISOString()
                  };

                  // Update status progress to the main API
                  await axios.patch(`${API_BASE}/Raman/request/${currentRequest.id}/progress`, body);

                  // // Stop alarm based on batch_number
                  // await axios.post('http://10.126.15.208:5005/next-clicked', {
                  //       batch_number: currentRequest.batch_number
                  // }, {
                  //       headers: {
                  //             "Content-Type": "application/json"
                  //       }
                  // });

                  // Send Telegram notification
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

      // Toggle vat selection (QC) - cannot select if already chosen in the same batch
      const toggleVat = (requestId, vatNumber, batchNumber, materialId) => {
            const usedVats = usedVatsByBatch[`${batchNumber}__${materialId}`] || [];
            if (usedVats.includes(vatNumber)) return;

            setOnProgress(prevProgress => {
                  const updatedProgress = prevProgress.map(item => {
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
                  });

                  // Update modal item from updatedProgress
                  const updatedItem = updatedProgress.find(item => item.id === requestId);
                  setVatModalOpen(prev => ({
                        ...prev,
                        item: updatedItem
                  }));

                  return updatedProgress;
            });
      };

      // Submit progress to complete (QC)
      const submitProgress = async (request) => {
            try {
                  await axios.post(`${API_BASE}/Raman/request/${request.id}/vats`, {
                        vats: request.selectedVats
                  });

                  await axios.patch(`${API_BASE}/Raman/request/${request.id}/complete`, {
                        completed_at: new Date().toISOString()
                  });

                  await fetchRequests();

                  if (request.batch_number && request.material_id) {
                        const vats = await fetchUsedVats(request.batch_number, request.material_id);
                        setUsedVatsByBatch(prev => ({
                              ...prev,
                              [`${request.batch_number}__${request.material_id}`]: vats
                        }));
                  }

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
            <div className={`${cardBg} rounded-xl ${cardShadow} border-l-4 ${color} p-6 hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between">
                        <div>
                              <p className={`text-sm font-medium ${textSecondary}`}>{title}</p>
                              <p className={`text-3xl font-bold ${textMain}`}>{count}</p>
                        </div>
                        <Icon className="h-8 w-8 text-gray-400" />
                  </div>
            </div>
      );
      return (
            <>
                  {pages === 'warehouse' ? (
                        <div className={`min-h-screen ${bgMain} p-6 mt-20`}>
                              <div className="w-full">
                                    {/* Header */}
                                    <div className={`${cardBg} rounded-xl ${cardShadow} p-6 mb-6`}>
                                          <div className="flex items-center justify-between">
                                                <div>
                                                      <h1 className={`text-3xl font-bold ${textMain}`}>Dashboard Warehouse</h1>
                                                      <p className={`${textSecondary} mt-1`}>Identifikasi Raman - Request Material</p>
                                                </div>
                                                <button
                                                      onClick={() => setPages('QC')}
                                                      className={`px-4 py-2 ${btnPrimary} text-white rounded-lg transition-colors`}
                                                >
                                                      Switch to QC View
                                                </button>
                                          </div>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                          {/* Material Input Section - Spans 2 columns on xl screens */}
                                          <div className="xl:col-span-2">
                                                <div className={`${cardBg} rounded-xl ${cardShadow} p-6 h-full`}>
                                                      <div className="flex items-center mb-6">
                                                            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-300 mr-3" />
                                                            <h2 className={`text-xl font-semibold ${textMain}`}>Input Material untuk Identifikasi Raman</h2>
                                                      </div>
                                                      {/* Operator Name Input */}
                                                      <div className="mb-6">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                                  Nama Operator Warehouse
                                                            </label>
                                                            <input
                                                                  type="text"
                                                                  value={inisial}
                                                                  className={`w-full px-4 py-3 border ${borderInput} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
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
                                                                                    className={`w-full px-4 py-3 mb-2 border ${borderInput} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                                                                              >
                                                                                    <option value="">Pilih Material</option>
                                                                                    <option value="MAGNESIUM STEARAT">MAGNESIUM STEARAT</option>
                                                                                    <option value="TALCUM">TALCUM</option>
                                                                                    <option value="CORN STARCH">CORN STARCH</option>
                                                                              </select>
                                                                              {/* Dropdown batch jika ada, dan input manual */}
                                                                              <div className="flex space-x-2 items-center">
                                                                                    <select
                                                                                          className={`w-1/2 px-4 py-3 mb-2 border ${borderInput} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                                                                          value={
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
                                                                                          className={`w-1/2 px-4 py-3 mb-2 border ${borderInput} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                                                                          type="text"
                                                                                          placeholder="Input Manual Batch"
                                                                                          value={batchNumbers[idx]}
                                                                                          onChange={e => handleBatchNumberInput(idx, e.target.value)}
                                                                                    />
                                                                              </div>
                                                                              <input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    max="200"
                                                                                    value={vatCounts[idx]}
                                                                                    onChange={e => handleVatCountInput(idx, e.target.value)}
                                                                                    placeholder="Jumlah Vat"
                                                                                    className={`w-full px-4 py-3 border ${borderInput} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
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
                                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
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
                                                                  className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                                                            >
                                                                  <Plus className="h-5 w-5 mr-2" />
                                                                  Tambah Material
                                                            </button>
                                                            <button
                                                                  onClick={createRequest}
                                                                  disabled={materials.every((m, i) =>
                                                                        m.trim() === '' || !batchNumbers[i] || !vatCounts[i] || isNaN(Number(vatCounts[i]))
                                                                  ) || !inisial}
                                                                  className={`px-6 py-3 ${btnPrimary} text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium`}
                                                            >
                                                                  Call Inspektor QC
                                                            </button>
                                                      </div>
                                                </div>
                                          </div>
                                          <div className="xl:col-span-1">
                                                {requests.length > 0 && (
                                                      <div className={`${cardBg} rounded-xl ${cardShadow} p-6 h-full`}>
                                                            <h3 className={`text-lg font-semibold ${textMain} mb-4`}>Permintaan Terkirim</h3>
                                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                  {requests.map((request) => (
                                                                        <div
                                                                              key={request.id}
                                                                              className={`p-4 ${bgHighlight} ${borderHighlight} border rounded-lg relative`}
                                                                        >
                                                                              <div className="absolute top-2 right-2 flex gap-2">
                                                                                    <button
                                                                                          onClick={() => handleShowDeleteModal(request, "request")}
                                                                                          className={`${bgDelete} text-white text-xs px-3 py-1 rounded`}
                                                                                          title="Hapus Permintaan"
                                                                                    >
                                                                                          Hapus
                                                                                    </button>
                                                                              </div>
                                                                              <div className="flex-1">
                                                                                    <p className={`text-xs ${textSecondary}`}>
                                                                                          Tanggal Timbang: {toLocaleID(request.tanggalTimbang)}
                                                                                    </p>
                                                                                    <p className={`font-medium ${textMain} text-sm`}>
                                                                                          Material: {request.materials.join(', ')}
                                                                                    </p>
                                                                                    <p className={`text-xs ${textSecondary} mt-1`}>
                                                                                          Operator: {request.operator}
                                                                                    </p>
                                                                                    <p className={`text-xs ${textSecondary}`}>
                                                                                          Batch: {request.batch_number}
                                                                                    </p>
                                                                                    <p className={`text-xs ${textSecondary}`}>
                                                                                          Jumlah Vat: {request.vatCount}
                                                                                    </p>
                                                                                    <p className={`text-xs ${textSecondary}`}>
                                                                                          Dikirim: {toLocaleID(request.timestamp)}
                                                                                    </p>
                                                                              </div>
                                                                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium ml-2 absolute bottom-2 right-2 dark:bg-yellow-800 dark:text-yellow-200">
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
                  ) : (
                        <div className={`min-h-screen ${bgMainQC} p-6 mt-20`}>
                              <div className="w-full">
                                    {/* Header */}
                                    <div className={`${cardBg} rounded-xl ${cardShadow} p-6 mb-6`}>
                                          <div className="flex items-center justify-between">
                                                <div>
                                                      <h1 className={`text-3xl font-bold ${textMain}`}>Dashboard QC Inspector</h1>
                                                      <p className={`${textSecondary} mt-1`}>Monitoring Identifikasi Raman</p>
                                                </div>
                                                <button
                                                      onClick={() => setPages('warehouse')}
                                                      className={`px-4 py-2 ${btnPrimaryQC} text-white rounded-lg transition-colors`}
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
                                          <div className={`${cardBg} rounded-xl ${cardShadow} p-6`}>
                                                <div className="flex items-center mb-4">
                                                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300 mr-3" />
                                                      <h2 className={`text-xl font-semibold ${textMain}`}>Request Raman</h2>
                                                </div>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                      {requests.map((request) => (
                                                            <div
                                                                  key={request.id}
                                                                  onClick={() => {
                                                                        setCurrentRequest(request);
                                                                        setShowModal(true);
                                                                  }}
                                                                  className={`p-4 border ${borderColor} rounded-lg ${tableHover} cursor-pointer transition-colors`}
                                                            >
                                                                  <p className={`font-medium ${textMain} text-sm`}>
                                                                        {request.materials.join(', ')}
                                                                  </p>
                                                                  <p className="text-sm text-blue-600 font-medium mt-1">
                                                                        Operator: {request.operator}
                                                                  </p>
                                                                  <p className={`text-xs ${textSecondary} mt-1`}>
                                                                        Batch: {request.batch_number}
                                                                  </p>
                                                                  <p className={`text-xs ${textSecondary}`}>
                                                                        Jumlah Vat: {request.vatCount}
                                                                  </p>
                                                                  <p className={`text-xs ${textSecondary} mt-1`}>
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
                                          <div className={`${cardBg} rounded-xl ${cardShadow} p-6`}>
                                                <div className="flex items-center mb-4">
                                                      <Eye className="h-6 w-6 text-blue-600 dark:text-blue-300 mr-3" />
                                                      <h2 className={`text-xl font-semibold ${textMain}`}>On Progress</h2>
                                                </div>
                                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                                      {onProgress.map((item) => {
                                                            const usedVats = usedVatsByBatch[`${item.batch_number}__${item.material_id}`] || [];
                                                            return (
                                                                  <div key={item.id} className={`p-4 border ${borderColor} rounded-lg relative`}>
                                                                        {/* Delete button */}
                                                                        <button
                                                                              onClick={() => handleShowDeleteModal(item, "progress")}
                                                                              className={`${bgDelete} text-white text-xs px-3 py-1 rounded`}
                                                                              title="Hapus Permintaan"
                                                                        >
                                                                              Hapus
                                                                        </button>
                                                                        <p className={`font-medium ${textMain} mb-2 text-sm`}>
                                                                              {item.materials.join(', ')}
                                                                        </p>
                                                                        <p className={`text-xs ${textSecondary} mb-1`}>
                                                                              Vat: {item.vatCount}
                                                                        </p>
                                                                        <p className="text-xs text-blue-600 font-medium mb-3">
                                                                              Operator: {item.operator}
                                                                        </p>
                                                                        <p className="text-xs text-purple-600 font-medium mb-2">
                                                                              Batch: {item.batch_number || '-'}
                                                                        </p>
                                                                        {/* Selected Vats Display */}
                                                                        <div className="mb-3">
                                                                              <p className={`text-xs ${textSecondary} mb-1`}>Selected Vats:</p>
                                                                              <p className="text-sm font-medium text-green-600">
                                                                                    {item.selectedVats && item.selectedVats.length > 0
                                                                                          ? item.selectedVats.map(vat => `Vat ${vat}`).join(', ')
                                                                                          : 'None selected'
                                                                                    }
                                                                              </p>
                                                                        </div>
                                                                        {isAdminAndInspektor && (
                                                                              <>
                                                                                    <button
                                                                                          onClick={() => setVatModalOpen({
                                                                                                isOpen: true,
                                                                                                item: item,
                                                                                                usedVats: usedVats
                                                                                          })}
                                                                                          className={`w-full px-4 py-2 mb-2 ${btnSecondary} text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm border ${borderInput}`}
                                                                                    >
                                                                                          Select Vats ({item.selectedVats?.length || 0}/{item.vatCount})
                                                                                    </button>
                                                                                    <button
                                                                                          onClick={() => submitProgress(item)}
                                                                                          disabled={!item.selectedVats || item.selectedVats.length === 0}
                                                                                          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm`}
                                                                                    >
                                                                                          Submit
                                                                                    </button>
                                                                              </>
                                                                        )}
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
                                                <div className={`${modalOverlay} fixed inset-0 flex items-center justify-center z-50`}>
                                                      <div className={`${bgModal} rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto`}>
                                                            <div className="flex justify-between items-center mb-4">
                                                                  <h3 className={`text-lg font-semibold ${modalText}`}>Select Vats</h3>
                                                                  <button
                                                                        onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                                        className={`${modalText} hover:text-gray-700`}
                                                                  >
                                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                  </button>
                                                            </div>
                                                            <div className="mb-4">
                                                                  <p className={`text-sm ${modalText}`}>Material: {vatModalOpen.item?.materials.join(', ')}</p>
                                                                  <p className={`text-sm ${modalText}`}>Batch: {vatModalOpen.item?.batch_number || '-'}</p>
                                                                  <p className={`text-sm ${modalText}`}>Total Vats: {vatModalOpen.item?.vatCount}</p>
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
                                                                                                ? 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200'
                                                                                                : isUsed
                                                                                                      ? 'bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                                                                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                                          }`}
                                                                              >
                                                                                    Vat {vatNum}
                                                                              </button>
                                                                        );
                                                                  })}
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                  <button
                                                                        onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs hover:bg-gray-300 dark:hover:bg-gray-800"
                                                                  >
                                                                        Batal
                                                                  </button>
                                                                  <button
                                                                        onClick={() => setVatModalOpen({ isOpen: false, item: null, usedVats: [] })}
                                                                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                                                                  >
                                                                        OK
                                                                  </button>
                                                            </div>
                                                      </div>
                                                </div>
                                          )}
                                          {/* Complete Section */}
                                          <div className={`${cardBg} rounded-xl ${cardShadow} p-6 relative`}>
                                                <div className="flex items-center mb-4">
                                                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300 mr-3" />
                                                      <h2 className={`text-xl font-semibold ${textMain}`}>Complete</h2>
                                                      <button
                                                            onClick={() => setShowFullComplete(true)}
                                                            className="ml-auto px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs"
                                                      >
                                                            Full View
                                                      </button>
                                                </div>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                      {[...completed]
                                                            .slice(0, 10)
                                                            .map((item) => (
                                                                  <div
                                                                        key={item.id}
                                                                        onClick={() => showCompleteDetail(item)}
                                                                        className={`p-4 border ${borderColor} rounded-lg hover:bg-green-50 dark:hover:bg-green-900 cursor-pointer transition-colors relative`}
                                                                  >
                                                                        <p className={`font-medium ${textMain} text-sm`}>
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
                                                                                          ? 'text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                                          : 'text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-xs inline-block font-semibold'
                                                                              }
                                                                        >
                                                                              Progress: {
                                                                                    getTotalIdentifiedForBatch(item.batch_number, item.material_id) === item.vatCount
                                                                                          ? 'Completed Raman'
                                                                                          : 'On-progress Raman'
                                                                              }
                                                                        </p>
                                                                        {/* Edit button only for Admin/Inspector */}
                                                                        {isAdminAndInspektor && (
                                                                              <button
                                                                                    onClick={e => {
                                                                                          e.stopPropagation();
                                                                                          setEditCompleteTarget(item);
                                                                                          setEditSelectedVats(item.selectedVats || []);
                                                                                          setEditNotes(item.notes || '');
                                                                                          setShowEditCompleteModal(true);
                                                                                    }}
                                                                                    className="absolute top-2 right-2 px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs hover:bg-yellow-200 dark:hover:bg-yellow-800"
                                                                                    title="Edit"
                                                                              >
                                                                                    Edit
                                                                              </button>
                                                                        )}
                                                                  </div>
                                                            ))}
                                                </div>
                                                {/* Request Modal for QC */}
                                                {isAdminAndInspektor && showModal && currentRequest && (
                                                      <div className={`${modalOverlay} fixed inset-0 flex items-center justify-center p-4 z-50`}>
                                                            <div className={`${bgModal} rounded-xl shadow-xl max-w-md w-full p-6`}>
                                                                  <h3 className={`text-xl font-semibold ${modalText} mb-4`}>
                                                                        Process Request
                                                                  </h3>
                                                                  <div className="space-y-4">
                                                                        <div>
                                                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                                                    Materials:
                                                                              </label>
                                                                              <p className={`${modalText} ${modalInput} p-3 rounded-lg`}>
                                                                                    {currentRequest?.materials.join(', ')}
                                                                              </p>
                                                                        </div>
                                                                        <div>
                                                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                                                    Operator:
                                                                              </label>
                                                                              <p className="text-blue-600 dark:text-blue-200 font-medium bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                                                                    {currentRequest?.operator}
                                                                              </p>
                                                                        </div>
                                                                        <div>
                                                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                                                    Batch Number:
                                                                              </label>
                                                                              <p className="text-purple-800 dark:text-purple-200 font-bold bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                                                                    {currentRequest?.batch_number || '-'}
                                                                              </p>
                                                                        </div>
                                                                        <div>
                                                                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                                                    Jumlah Vat:
                                                                              </label>
                                                                              <p className={`${modalText} ${modalInput} p-3 rounded-lg`}>
                                                                                    {currentRequest?.vatCount || '-'}
                                                                              </p>
                                                                        </div>
                                                                  </div>
                                                                  <div className="flex space-x-3 mt-6">
                                                                        <button
                                                                              onClick={() => setShowModal(false)}
                                                                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                                        >
                                                                              Cancel
                                                                        </button>
                                                                        <button
                                                                              onClick={processRequest}
                                                                              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg transition-colors"
                                                                        >
                                                                              Next
                                                                        </button>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                )}
                                                {/* Full Complete Modal */}
                                                {showFullComplete && (
                                                      <FullCompleteModal
                                                            completes={completed}
                                                            getTotalIdentifiedForBatch={getTotalIdentifiedForBatch}
                                                            onClose={() => setShowFullComplete(false)}
                                                      />
                                                )}
                                                {/* Modal Edit Complete */}
                                                <Modal isOpen={showEditCompleteModal} onClose={() => setShowEditCompleteModal(false)} isCentered>
                                                      <ModalOverlay />
                                                      <ModalContent>
                                                            <ModalHeader color="yellow.600">Edit Data Complete</ModalHeader>
                                                            <ModalBody>
                                                                  <div className="mb-3">
                                                                        <div className="font-medium mb-2">Pilih Vat (boleh ubah):</div>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                              {Array.from({ length: editCompleteTarget?.vatCount || 0 }, (_, i) => i + 1).map(vatNum => {
                                                                                    const isSelected = editSelectedVats.includes(vatNum);
                                                                                    return (
                                                                                          <button
                                                                                                key={vatNum}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                      setEditSelectedVats(isSelected
                                                                                                            ? editSelectedVats.filter(v => v !== vatNum)
                                                                                                            : [...editSelectedVats, vatNum]);
                                                                                                }}
                                                                                                className={`p-2 rounded-lg border-2 transition-all ${isSelected
                                                                                                      ? 'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200'
                                                                                                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                                                      }`}
                                                                                          >
                                                                                                Vat {vatNum}
                                                                                          </button>
                                                                                    );
                                                                              })}
                                                                        </div>
                                                                  </div>
                                                                  <div className="mb-3">
                                                                        <label className="block text-sm font-medium mb-1">Catatan/Notes</label>
                                                                        <textarea
                                                                              value={editNotes}
                                                                              onChange={e => setEditNotes(e.target.value)}
                                                                              className="w-full p-2 border rounded-lg"
                                                                              rows={2}
                                                                        />
                                                                  </div>
                                                                  <div className="text-xs text-gray-500">
                                                                        Hanya Admin/Inspector yang bisa mengubah data complete. Mohon cek ulang sebelum menyimpan perubahan.
                                                                  </div>
                                                            </ModalBody>
                                                            <ModalFooter>
                                                                  <Button onClick={() => setShowEditCompleteModal(false)} colorScheme="gray" mr={3}>
                                                                        Batal
                                                                  </Button>
                                                                  <Button
                                                                        colorScheme="yellow"
                                                                        isLoading={editLoading}
                                                                        onClick={async () => {
                                                                              await handleEditComplete(editCompleteTarget.id, editSelectedVats, editNotes);
                                                                        }}
                                                                  >
                                                                        Simpan
                                                                  </Button>
                                                            </ModalFooter>
                                                      </ModalContent>
                                                </Modal>
                                          </div>
                                    </div>
                                    {/* Complete Detail Modal */}
                                    {isAdminAndInspektor && showDetailModal && selectedComplete && (
                                          <div className={`${modalOverlay} fixed inset-0 flex items-center justify-center p-4 z-50`}>
                                                <div className={`${bgModal} rounded-xl shadow-xl max-w-md w-full p-6`}>
                                                      <div className="flex items-center mb-4">
                                                            <FileText className="h-6 w-6 text-green-600 dark:text-green-200 mr-3" />
                                                            <h3 className={`text-xl font-semibold ${modalText}`}>
                                                                  Detail Complete
                                                            </h3>
                                                      </div>
                                                      <div className="space-y-4">
                                                            <div>
                                                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                                        Materials:
                                                                  </label>
                                                                  <p className={modalText}>{selectedComplete.materials.join(', ')}</p>
                                                            </div>
                                                            <div>
                                                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                                        Batch Number:
                                                                  </label>
                                                                  <p className="text-purple-800 dark:text-purple-200 font-bold">{selectedComplete.batch_number || '-'}</p>
                                                            </div>
                                                            <div>
                                                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                                        Vat Teridentifikasi:
                                                                  </label>
                                                                  <div className="flex items-center space-x-2">
                                                                        <span className="text-lg font-bold text-green-600 dark:text-green-200">
                                                                              {getTotalIdentifiedForBatch(selectedComplete.batch_number, selectedComplete.material_id)}
                                                                        </span>
                                                                        <span className="text-gray-500 dark:text-gray-300">of</span>
                                                                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                                              {selectedComplete.vatCount}
                                                                        </span>
                                                                        <span className="text-gray-500 dark:text-gray-300">vat</span>
                                                                  </div>
                                                                  {selectedComplete.selectedVats && selectedComplete.selectedVats.length > 0 && (
                                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                              Vat yang teridentifikasi pada request ini: {selectedComplete.selectedVats.sort((a, b) => a - b).join(', ')}
                                                                        </p>
                                                                  )}
                                                            </div>
                                                            <div>
                                                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                                        Operator Warehouse:
                                                                  </label>
                                                                  <p className="text-blue-600 dark:text-blue-200 font-medium">{selectedComplete.operator}</p>
                                                            </div>
                                                            <div className="flex items-center">
                                                                  <User className="h-4 w-4 text-gray-500 dark:text-gray-300 mr-2" />
                                                                  <span className="text-sm text-gray-600 dark:text-gray-200">
                                                                        QC Inspector: {selectedComplete.inspector}
                                                                  </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-300 mr-2" />
                                                                  <span className="text-sm text-gray-600 dark:text-gray-200">
                                                                        Selesai: {selectedComplete.completedAt ? dayjs(selectedComplete.completedAt).add(7, 'hour').format('DD MMM YYYY HH:mm:ss') : ''}
                                                                  </span>
                                                            </div>
                                                      </div>
                                                      <button
                                                            onClick={() => setShowDetailModal(false)}
                                                            className="w-full mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-900 text-white rounded-lg transition-colors"
                                                      >
                                                            Close
                                                      </button>
                                                </div>
                                          </div>
                                    )}
                              </div>
                        </div>
                  )}
                  {deleteModalOpen && (
                        <DeleteWithNotesModal
                              isOpen={deleteModalOpen}
                              onClose={() => setDeleteModalOpen(false)}
                              onConfirm={handleDeleteConfirm}
                              item={deleteTarget}
                              type={deleteType}
                        />
                  )}
            </>
      );
}

export default RamanDashboard;
