import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
      Spinner,
      Text,
      Modal,
      ModalOverlay,
      ModalContent,
      ModalBody,
      useDisclosure,
      useColorModeValue,
} from "@chakra-ui/react";
import DOMPurify from "dompurify";

// DO NOT call hooks outside of React components!
// All useColorModeValue calls must be inside the main component body.

export default function SamplingCardForm() {
      const Navigate = useNavigate();
      const { id } = useParams();
      const isEditMode = !!id;

      const { isOpen, onOpen, onClose } = useDisclosure();
      const [isLoading, setIsLoading] = useState(false);
      const [formErrors, setFormErrors] = useState({});
      const [showConfirmation, setShowConfirmation] = useState(false);

      // Enhanced color scheme - more colorful for light mode, elegant for dark mode
      const _bgMain = useColorModeValue("#f9fafb", "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)");
      const _bgCard = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(17, 24, 39, 0.95)");
      const _borderSection = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
      const _sectionBg = useColorModeValue("linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", "linear-gradient(135deg, #1f2937 0%, #111827 100%)");
      const _sectionHover = useColorModeValue("linear-gradient(135deg, #c7d2fe 0%, #e9d5ff 100%)", "linear-gradient(135deg, #374151 0%, #1f2937 100%)");
      const _textSection = useColorModeValue("#1e293b", "#f1f5f9");
      const _inputBorder = useColorModeValue("rgba(139, 92, 246, 0.4)", "rgba(75, 85, 99, 0.8)");
      const _inputBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(31, 41, 55, 0.8)");
      const _inputFocus = useColorModeValue("#8b5cf6", "#a78bfa");
      const _errorBg = useColorModeValue("rgba(254, 226, 226, 0.8)", "rgba(127, 29, 29, 0.3)");
      const _errorBorder = useColorModeValue("#f87171", "#dc2626");
      const _resetBtnHover = useColorModeValue("rgba(219, 234, 254, 0.8)", "rgba(30, 58, 138, 0.3)");
      const _btnBg = useColorModeValue("linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)");
      const _cancelBtnBg = useColorModeValue("linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", "linear-gradient(135deg, #374151 0%, #4b5563 100%)");
      const _headerBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(17, 24, 39, 0.9)");
      const _headerText = useColorModeValue("#1e293b", "#f1f5f9");
      const _selectOptionColor = useColorModeValue("#1e293b", "#e2e8f0");
      const _inputTextColor = useColorModeValue("#1e293b", "#e2e8f0");
      const _spinnerBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(17, 24, 39, 0.9)");
      const _spinnerBorder = useColorModeValue("#8b5cf6", "#a78bfa");
      const _headerBtnColor = useColorModeValue("#6366f1", "#a78bfa");
      const _borderColorConfirm = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
      const _searchBtnBg = useColorModeValue("linear-gradient(135deg, #10b981 0%, #059669 100%)", "linear-gradient(135deg, #065f46 0%, #047857 100%)");
      const _uploadBtnBg = useColorModeValue("linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", "linear-gradient(135deg, #92400e 0%, #b45309 100%)");
      const _pagesBtnBg = useColorModeValue("linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)");

      const [form, setForm] = useState({
            ref_card_number: "",
            nama_material: "",
            kode_item: "",
            manufacture: "",
            card_number: "",
            expired_date: "",
            storage_condition: "",
            manufacturer_status: "",
            condition_desc: "",
            outer_packaging: "",
            inner_packaging: "",
            sampling_method: "",
            tools_used: "",
            sampling_process: "",
            cleaning_tools: "",
            samples: {
                  reduce: "",
                  non_reduce: "",
                  lod: "",
                  pertinggal: "",
                  mikro: "",
                  uji_luar: "",
            },
      });

      const sanitizeInput = (input) => {
            if (typeof input === "string") {
                  return DOMPurify.sanitize(input);
            }
            return input;
      };

      const sanitizeDate = (input) => {
            if (typeof input === "string") {
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                  if (dateRegex.test(input)) {
                        return input;
                  }
                  return "";
            }
            return input;
      };

      const fetchCardData = useCallback(async () => {
            if (!form.ref_card_number || !form.ref_card_number.startsWith("KS-QC")) {
                  toast.error("Nomor kartu tidak valid atau tidak diawali dengan 'KS-QC'");
                  return;
            }

            setIsLoading(true);
            try {
                  const response = await fetch(
                        `http://localhost:8081/cards/getMaterialDetailByCardNumber/${form.ref_card_number}`
                  );

                  if (!response.ok) throw new Error("Failed to fetch card data");

                  const data = await response.json();

                  // Jika ingin membuat fungsi terpisah untuk reset, bisa seperti ini:



                  const sanitizedData = {
                        material_id: data.material_id,
                        sampling_card_id: data.sampling_card_id,
                        nama_material: sanitizeInput(data.nama_material),
                        kode_item: sanitizeInput(data.kode_item),
                        manufacture: sanitizeInput(data.manufacture),
                        card_number: sanitizeInput(data.card_number),
                        expired_date: sanitizeInput(data.expired_date),
                        storage_condition: sanitizeInput(data.storage_condition),
                        manufacturer_status: sanitizeInput(data.manufacturer_status),
                        condition_desc: sanitizeInput(data.condition_desc),
                        outer_packaging: sanitizeInput(data.outer_packaging),
                        inner_packaging: sanitizeInput(data.inner_packaging),
                        sampling_method: sanitizeInput(data.sampling_method),
                        tools_used: sanitizeInput(data.tools_used),
                        sampling_process: sanitizeInput(data.sampling_process),
                        cleaning_tools: sanitizeInput(data.cleaning_tools),
                        samples: {
                              reduce: sanitizeInput(data.reduce),
                              non_reduce: sanitizeInput(data.non_reduce),
                              lod: sanitizeInput(data.lod),
                              pertinggal: sanitizeInput(data.pertinggal),
                              mikro: sanitizeInput(data.mikro),
                              uji_luar: sanitizeInput(data.uji_luar),
                        },
                        qc_supervisor_approved: data.qc_supervisor_approved,
                        qc_supervisor_name: sanitizeInput(data.qc_supervisor_name),
                        qc_supervisor_approval_date: sanitizeDate(data.qc_supervisor_approval_date),
                        qc_manager_approved: data.qc_manager_approved,
                        qc_manager_name: sanitizeInput(data.qc_manager_name),
                        qc_manager_approval_date: sanitizeDate(data.qc_manager_approval_date),
                        qa_manager_approved: data.qa_manager_approved,
                        qa_manager_name: sanitizeInput(data.qa_manager_name),
                        qa_manager_approval_date: sanitizeDate(data.qa_manager_approval_date),
                        approval_notes: sanitizeInput(data.approval_notes),
                        gallery_photos: data.gallery_photos || {},
                  };

                  setForm(sanitizedData);
                  toast.success("Data kartu sampling berhasil dimuat");
            } catch (error) {
                  console.error("Error fetching card:", error);
                  toast.error("Gagal memuat data kartu sampling");
            } finally {
                  setIsLoading(false);
            }
      }, [form.ref_card_number]);
      useEffect(() => {
            if (isEditMode) {
                  fetchCardData();
            }
      }, [isEditMode, fetchCardData]);

      const handleInputChange = (e) => {
            const { name, value } = e.target;
            let sanitizedValue = value;

            if (formErrors[name]) {
                  setFormErrors((prev) => ({ ...prev, [name]: "" }));
            } else {
                  sanitizedValue = sanitizeInput(value);
            }

            if (Object.keys(form.samples).includes(name)) {
                  setForm((prevForm) => ({
                        ...prevForm,
                        samples: {
                              ...prevForm.samples,
                              [name]: sanitizedValue,
                        },
                  }));
            } else {
                  setForm((prevForm) => ({
                        ...prevForm,
                        [name]: sanitizedValue,
                  }));
            }

            if (name === "ref_card_number") {
                  const trimmedValue = sanitizedValue.trim();

                  if (trimmedValue !== "" && !trimmedValue.startsWith("KS-QC")) {
                        setFormErrors((prev) => ({
                              ...prev,
                              ref_card_number: "Harus diawali dengan 'KS-QC'",
                        }));
                  }
            }
      };

      const validateForm = () => {
            const errors = {};
            const requiredFields = ["nama_material", "kode_item", "card_number"];

            requiredFields.forEach((field) => {
                  if (!form[field]) {
                        errors[field] = "Field ini wajib diisi";
                  }
            });

            const sanitizeInput = (input) => {
                  if (typeof input === "string") {
                        return DOMPurify.sanitize(input.trim());
                  }
                  return input;
            };

            if (form.nama_material && sanitizeInput(form.nama_material) !== form.nama_material) {
                  errors.nama_material = "Nama material mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.kode_item && sanitizeInput(form.kode_item) !== form.kode_item) {
                  errors.kode_item = "Kode item mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.manufacture && sanitizeInput(form.manufacture) !== form.manufacture) {
                  errors.manufacture = "Manufacture mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.card_number && sanitizeInput(form.card_number) !== form.card_number) {
                  errors.card_number = "Nomor kartu mengandung karakter yang tidak diperbolehkan.";
            }
            if (form.expired_date && sanitizeInput(form.expired_date) !== form.expired_date) {
                  errors.expired_date = "Expired date mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.storage_condition && sanitizeInput(form.storage_condition) !== form.storage_condition) {
                  errors.storage_condition = "Storage condition mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.manufacturer_status && sanitizeInput(form.manufacturer_status) !== form.manufacturer_status) {
                  errors.manufacturer_status = "Manufacturer status mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.condition_desc && sanitizeInput(form.condition_desc) !== form.condition_desc) {
                  errors.condition_desc = "Condition description mengandung karakter yang tidak diperbolehkan.";
            }
            if (form.sampling_method && sanitizeInput(form.sampling_method) !== form.sampling_method) {
                  errors.sampling_method = "Sampling method mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.tools_used && sanitizeInput(form.tools_used) !== form.tools_used) {
                  errors.tools_used = "Tools used mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.cleaning_tools && sanitizeInput(form.cleaning_tools) !== form.cleaning_tools) {
                  errors.cleaning_tools = "Cleaning tools mengandung karakter yang tidak diperbolehkan.";
            }

            if (form.samples) {
                  Object.keys(form.samples).forEach((sample) => {
                        if (sanitizeInput(form.samples[sample]) !== form.samples[sample]) {
                              errors[sample] = "Nilai sample mengandung karakter yang tidak diperbolehkan.";
                        }
                  });
            }

            setFormErrors(errors);
            return Object.keys(errors).length === 0;
      };

      const handleNextToUpload = async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                  toast.error("Mohon periksa kembali form Anda");
                  return;
            }

            try {
                  await localStorage.setItem("tempSamplingCardData", JSON.stringify(form));
                  toast.success("Data berhasil disimpan. Silakan lanjut upload gambar!");
                  await Navigate("/UploadToGdrive");
            } catch (error) {
                  console.error("Error saat menyimpan data ke localStorage:", error);
                  toast.error("Gagal menyimpan data, silakan coba lagi.");
            }
      };

      const handleNextToPages2 = (e) => {
            e.preventDefault();

            if (!validateForm()) {
                  toast.error("Mohon periksa kembali form Anda");
                  return;
            }

            try {
                  localStorage.setItem("tempSamplingCardData", JSON.stringify(form));
                  toast.success("Data berhasil disimpan. Silakan lanjut ke halaman 2!");
                  Navigate("/SamplingHistoryForm");
            } catch (error) {
                  console.error("Error saat menyimpan data ke localStorage:", error);
                  toast.error("Gagal menyimpan data, silakan coba lagi.");
            }
      };

      useEffect(() => {
            const savedFormData = localStorage.getItem("tempSamplingCardData");
            const uploadedImageLinks = localStorage.getItem("uploadedImageLinks");

            if (savedFormData) {
                  try {
                        const parsedData = JSON.parse(savedFormData);
                        const parsedUploadedLinks = uploadedImageLinks ? JSON.parse(uploadedImageLinks) : [];

                        setForm({
                              ...parsedData,
                              uploaded_links: parsedUploadedLinks,
                        });
                        console.log("✅ Data form berhasil dimuat dari localStorage.");
                  } catch (error) {
                        console.error("❌ Gagal memuat data form dari localStorage:", error);
                  }
            }
      }, []);

      const handleSubmit = (e) => {
            e.preventDefault();

            if (!validateForm()) {
                  toast.error("Mohon periksa kembali form Anda");
                  return;
            }

            setShowConfirmation(true);
      };

      const confirmSubmit = async () => {
            setIsLoading(true);
            onOpen();

            try {
                  const sanitizedForm = {
                        nama_material: sanitizeInput(form.nama_material),
                        kode_item: sanitizeInput(form.kode_item),
                        manufacture: sanitizeInput(form.manufacture),
                        card_number: sanitizeInput(form.card_number),
                        expired_date: sanitizeDate(form.expired_date),
                        storage_condition: sanitizeInput(form.storage_condition),
                        manufacturer_status: sanitizeInput(form.manufacturer_status),
                        condition_desc: sanitizeInput(form.condition_desc),
                        outer_packaging: sanitizeInput(form.outer_packaging),
                        inner_packaging: sanitizeInput(form.inner_packaging),
                        sampling_method: sanitizeInput(form.sampling_method),
                        tools_used: sanitizeInput(form.tools_used),
                        sampling_process: sanitizeInput(form.sampling_process),
                        cleaning_tools: sanitizeInput(form.cleaning_tools),
                        samples: {
                              reduce: sanitizeInput(form.samples.reduce),
                              non_reduce: sanitizeInput(form.samples.non_reduce),
                              lod: sanitizeInput(form.samples.lod),
                              pertinggal: sanitizeInput(form.samples.pertinggal),
                              mikro: sanitizeInput(form.samples.mikro),
                              uji_luar: sanitizeInput(form.samples.uji_luar),
                        },
                        created_by: "ibnu",
                  };

                  const uploadedLinks = JSON.parse(localStorage.getItem("uploadedImageLinks")) || [];
                  sanitizedForm.uploaded_links = uploadedLinks;

                  const formData = new FormData();
                  formData.append("data", JSON.stringify(sanitizedForm));

                  const response = await fetch("http://localhost:8081/cards/sampling-cards", {
                        method: "POST",
                        headers: {
                              "Content-Type": "application/json",
                        },
                        body: JSON.stringify(sanitizedForm),
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || "Terjadi kesalahan saat mengirim data ke server.");
                  }

                  localStorage.removeItem("tempSamplingCardId");
                  localStorage.removeItem("tempSamplingCardData");
                  localStorage.removeItem("uploadedImageLinks");

                  toast.success("Kartu sampling berhasil dibuat!");

                  setTimeout(() => {
                        onClose();
                        setShowConfirmation(false);
                        Navigate("/formPage");
                  }, 2500);
            } catch (error) {
                  console.error("Error saat submit form:", error);
                  toast.error(error.message || "Terjadi kesalahan pada server.");
            } finally {
                  setIsLoading(false);
            }
      };

      const [expandedSections, setExpandedSections] = useState({
            infoMaterial: true,
            infoKartu: true,
            detailMaterial: true,
            kondisiSampling: true,
            jumlahSample: true,
            pembersihanAlat: true,
            kemasanPrimer: false,
            kemasanSekunder: false,
      });

      const toggleSection = (section) => {
            setExpandedSections((prev) => ({
                  ...prev,
                  [section]: !prev[section],
            }));
      };
      const handleResetForm = () => {
            // Konfirmasi sebelum reset
            if (window.confirm("Apakah Anda yakin ingin mereset semua data form?")) {
                  // Reset form state
                  setForm({
                        ref_card_number: "",
                        nama_material: "",
                        kode_item: "",
                        manufacture: "",
                        card_number: "",
                        expired_date: "",
                        storage_condition: "",
                        manufacturer_status: "",
                        condition_desc: "",
                        outer_packaging: "",
                        inner_packaging: "",
                        sampling_method: "",
                        tools_used: "",
                        sampling_process: "",
                        cleaning_tools: "",
                        samples: {
                              reduce: "",
                              non_reduce: "",
                              lod: "",
                              pertinggal: "",
                              mikro: "",
                              uji_luar: "",
                        },
                  });

                  // Reset errors
                  setFormErrors({});

                  // Reset expanded sections
                  setExpandedSections({
                        infoMaterial: true,
                        infoKartu: true,
                        detailMaterial: true,
                        kondisiSampling: true,
                        jumlahSample: true,
                        pembersihanAlat: true,
                        kemasanPrimer: false,
                        kemasanSekunder: false,
                  });

                  // Clear localStorage
                  localStorage.removeItem("tempSamplingCardData");
                  localStorage.removeItem("uploadedImageLinks");

                  toast.success("Form berhasil direset");
            }
      };

      return (
            <div className="min-h-screen flex flex-col" style={{ background: _bgMain }}>
                  <ToastContainer position="top-right" autoClose={3000} />

                  {/* Header */}
                  <header
                        style={{
                              background: _headerBg,
                              color: _headerText,
                              boxShadow: useColorModeValue(
                                    "0 4px 20px rgba(139, 92, 246, 0.15)",
                                    "0 4px 20px rgba(0, 0, 0, 0.5)"
                              ),
                              backdropFilter: "blur(10px)",
                        }}
                        className="sticky top-0 z-10"
                  >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                              <h1 className="text-2xl font-bold" style={{ color: _headerText }}>
                                    {isEditMode ? "Update Kartu Sampling" : "Buat Kartu Sampling Baru"}
                              </h1>
                              <button
                                    onClick={() => Navigate("/ListSamplingCard")}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg transition-all hover:scale-105"
                                    style={{
                                          color: _headerBtnColor,
                                          background: useColorModeValue("rgba(139, 92, 246, 0.1)", "rgba(167, 139, 250, 0.1)"),
                                          border: `1px solid ${_headerBtnColor}`,
                                    }}
                              >
                                    <span className="text-xl">←</span> Kembali ke Daftar
                              </button>
                        </div>
                  </header>

                  {/* Main Content */}
                  <main className="flex-grow p-4 sm:p-6">
                        <div
                              className="max-w-7xl mx-auto rounded-xl shadow-2xl backdrop-blur-sm border"
                              style={{
                                    background: _bgCard,
                                    borderColor: _borderSection,
                                    boxShadow: useColorModeValue(
                                          "0 25px 50px -12px rgba(139, 92, 246, 0.25)",
                                          "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
                                    )
                              }}
                        >
                              {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 rounded-xl"
                                          style={{ background: _spinnerBg, backdropFilter: "blur(5px)" }}>
                                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                                                style={{ borderColor: _spinnerBorder }}
                                          ></div>
                                    </div>
                              )}

                              <form className="p-6" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {/* Left Column */}
                                          <div className="space-y-6">
                                                <Input
                                                      label="No Kartu Sampling Referensi"
                                                      name="ref_card_number"
                                                      value={form.ref_card_number}
                                                      onChange={handleInputChange}
                                                      onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                  e.preventDefault();
                                                                  fetchCardData();
                                                            }
                                                      }}
                                                      inputTextColor={_inputTextColor}
                                                      inputBorder={_inputBorder}
                                                      inputBg={_inputBg}
                                                      inputFocus={_inputFocus}
                                                />

                                                <div>
                                                      <button
                                                            type="button"
                                                            style={{
                                                                  background: _searchBtnBg,
                                                                  color: "white",
                                                                  boxShadow: useColorModeValue(
                                                                        "0 4px 15px rgba(16, 185, 129, 0.4)",
                                                                        "0 4px 15px rgba(6, 95, 70, 0.6)"
                                                                  )
                                                            }}
                                                            className="transition-all px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:scale-105 hover:shadow-lg"
                                                            onClick={fetchCardData}
                                                      >
                                                            🔍 Search
                                                      </button>
                                                </div>
                                                <Section
                                                      title="Info Material"
                                                      isExpanded={expandedSections.infoMaterial}
                                                      onToggle={() => toggleSection("infoMaterial")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <Input
                                                            label="Nama Material"
                                                            name="nama_material"
                                                            value={form.nama_material}
                                                            onChange={handleInputChange}
                                                            error={formErrors.nama_material}
                                                            required
                                                            maxLength={100}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Kode Item"
                                                            name="kode_item"
                                                            value={form.kode_item}
                                                            onChange={handleInputChange}
                                                            error={formErrors.kode_item}
                                                            required
                                                            maxLength={50}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Manufacture"
                                                            name="manufacture"
                                                            value={form.manufacture}
                                                            onChange={handleInputChange}
                                                            maxLength={100}
                                                            required
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Info Kartu"
                                                      isExpanded={expandedSections.infoKartu}
                                                      onToggle={() => toggleSection("infoKartu")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <Input
                                                            label="Nomor Kartu"
                                                            name="card_number"
                                                            value={form.card_number}
                                                            onChange={handleInputChange}
                                                            error={formErrors.card_number}
                                                            required
                                                            maxLength={50}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Detail Material"
                                                      isExpanded={expandedSections.detailMaterial}
                                                      onToggle={() => toggleSection("detailMaterial")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <Input
                                                            label="Expired Date"
                                                            name="expired_date"
                                                            value={form.expired_date}
                                                            onChange={handleInputChange}
                                                            error={formErrors.expired_date}
                                                            required
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Select
                                                            label="Suhu Penyimpanan"
                                                            name="storage_condition"
                                                            value={form.storage_condition}
                                                            onChange={handleInputChange}
                                                            maxLength={50}
                                                            options={[
                                                                  { value: "", label: "-- Pilih Status --" },
                                                                  { value: "STORE BELOW 25°C", label: "STORE BELOW 25°C" },
                                                                  { value: "STORE BELOW 30°C", label: "STORE BELOW 30°C" },
                                                            ]}
                                                            required
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            selectOptionColor={_selectOptionColor}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Select
                                                            label="Status Pabrikan"
                                                            name="manufacturer_status"
                                                            value={form.manufacturer_status}
                                                            onChange={handleInputChange}
                                                            required
                                                            options={[
                                                                  { value: "", label: "-- Pilih Status --" },
                                                                  { value: "APPROVED", label: "APPROVED" },
                                                                  { value: "QUALIFIED", label: "QUALIFIED" },
                                                                  { value: "MLR", label: "MLR" },
                                                                  { value: "REDUCE TESTING", label: "REDUCE TESTING" },
                                                                  { value: "RELEASED BY CoA", label: "RELEASED BY CoA" },
                                                            ]}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            selectOptionColor={_selectOptionColor}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <TextArea
                                                            label="Deskripsi Kondisi"
                                                            name="condition_desc"
                                                            value={form.condition_desc}
                                                            onChange={handleInputChange}
                                                            error={formErrors.condition_desc}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Kemasan Primer"
                                                      isExpanded={expandedSections.kemasanPrimer}
                                                      onToggle={() => toggleSection("kemasanPrimer")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <TextArea
                                                            label="Kemasan Dalam"
                                                            name="inner_packaging"
                                                            value={form.inner_packaging}
                                                            onChange={handleInputChange}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Kemasan Sekunder"
                                                      isExpanded={expandedSections.kemasanSekunder}
                                                      onToggle={() => toggleSection("kemasanSekunder")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <TextArea
                                                            label="Kemasan Luar"
                                                            name="outer_packaging"
                                                            value={form.outer_packaging}
                                                            onChange={handleInputChange}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>
                                          </div>

                                          {/* Right Column */}
                                          <div className="space-y-6">
                                                <Section
                                                      title="Kondisi Sampling"
                                                      isExpanded={expandedSections.kondisiSampling}
                                                      onToggle={() => toggleSection("kondisiSampling")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <TextArea
                                                            label="Metode Sampling"
                                                            name="sampling_method"
                                                            value={form.sampling_method}
                                                            onChange={handleInputChange}
                                                            error={formErrors.sampling_method}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <TextArea
                                                            label="Alat yang Digunakan"
                                                            name="tools_used"
                                                            value={form.tools_used}
                                                            onChange={handleInputChange}
                                                            error={formErrors.tools_used}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <TextArea
                                                            label="Proses Sampling"
                                                            name="sampling_process"
                                                            value={form.sampling_process}
                                                            onChange={handleInputChange}
                                                            maxLength={1000}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Jumlah Sample"
                                                      isExpanded={expandedSections.jumlahSample}
                                                      onToggle={() => toggleSection("jumlahSample")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <Input
                                                            label="Reduce"
                                                            name="reduce"
                                                            value={form.samples.reduce}
                                                            onChange={handleInputChange}
                                                            error={formErrors.reduce}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Non Reduce"
                                                            name="non_reduce"
                                                            value={form.samples.non_reduce}
                                                            onChange={handleInputChange}
                                                            error={formErrors.non_reduce}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="LOD"
                                                            name="lod"
                                                            value={form.samples.lod}
                                                            onChange={handleInputChange}
                                                            error={formErrors.lod}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Pertinggal"
                                                            name="pertinggal"
                                                            value={form.samples.pertinggal}
                                                            onChange={handleInputChange}
                                                            error={formErrors.pertinggal}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Mikro"
                                                            name="mikro"
                                                            value={form.samples.mikro}
                                                            onChange={handleInputChange}
                                                            error={formErrors.mikro}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                      <Input
                                                            label="Uji Luar"
                                                            name="uji_luar"
                                                            value={form.samples.uji_luar}
                                                            onChange={handleInputChange}
                                                            error={formErrors.uji_luar}
                                                            maxLength={20}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>

                                                <Section
                                                      title="Pembersihan Alat"
                                                      isExpanded={expandedSections.pembersihanAlat}
                                                      onToggle={() => toggleSection("pembersihanAlat")}
                                                      borderSection={_borderSection}
                                                      sectionBg={_sectionBg}
                                                      sectionHover={_sectionHover}
                                                      textSection={_textSection}
                                                >
                                                      <TextArea
                                                            label="Alat Pembersih"
                                                            name="cleaning_tools"
                                                            value={form.cleaning_tools}
                                                            onChange={handleInputChange}
                                                            error={formErrors.cleaning_tools}
                                                            maxLength={500}
                                                            inputBorder={_inputBorder}
                                                            inputBg={_inputBg}
                                                            inputFocus={_inputFocus}
                                                            errorBg={_errorBg}
                                                            errorBorder={_errorBorder}
                                                            inputTextColor={_inputTextColor}
                                                      />
                                                </Section>
                                          </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-8 flex flex-wrap gap-4 justify-end border-t pt-6"
                                          style={{ borderColor: _borderSection }}>

                                          <button
                                                type="button"
                                                onClick={() => Navigate("/ListSamplingCard")}
                                                className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                                                style={{
                                                      background: _cancelBtnBg,
                                                      color: _inputTextColor,
                                                      border: `1px solid ${_borderSection}`,
                                                }}
                                          >
                                                Batal
                                          </button>
                                          <button
                                                type="button"
                                                onClick={handleResetForm}
                                                className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                                                style={{
                                                      background: _resetBtnHover,
                                                      color: _inputTextColor,
                                                      border: `1px solid ${_borderSection}`,
                                                }}
                                          >
                                                🔄 Reset Form
                                          </button>

                                          <button
                                                type="button"
                                                onClick={handleNextToUpload}
                                                className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
                                                style={{
                                                      background: _uploadBtnBg,
                                                      boxShadow: useColorModeValue(
                                                            "0 4px 15px rgba(245, 158, 11, 0.4)",
                                                            "0 4px 15px rgba(146, 64, 14, 0.6)"
                                                      )
                                                }}
                                          >
                                                📤 Upload Gambar
                                          </button>

                                          <button
                                                type="button"
                                                onClick={handleNextToPages2}
                                                className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
                                                style={{
                                                      background: _pagesBtnBg,
                                                      boxShadow: useColorModeValue(
                                                            "0 4px 15px rgba(239, 68, 68, 0.4)",
                                                            "0 4px 15px rgba(153, 27, 27, 0.6)"
                                                      )
                                                }}
                                          >
                                                📝 Lanjut ke Halaman 2
                                          </button>

                                          <button
                                                type="submit"
                                                className="px-8 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                                                style={{
                                                      background: _btnBg,
                                                      boxShadow: useColorModeValue(
                                                            "0 4px 15px rgba(139, 92, 246, 0.4)",
                                                            "0 4px 15px rgba(99, 102, 241, 0.6)"
                                                      )
                                                }}
                                          >
                                                💾 Simpan Kartu Sampling
                                          </button>
                                    </div>
                              </form>
                        </div>
                  </main>

                  {/* Confirmation Modal */}
                  {showConfirmation && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                              <div
                                    className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
                                    style={{
                                          background: _bgCard,
                                          border: `1px solid ${_borderColorConfirm}`,
                                    }}
                              >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: _textSection }}>
                                          Konfirmasi Penyimpanan
                                    </h3>
                                    <p className="mb-6" style={{ color: _textSection }}>
                                          Apakah Anda yakin ingin menyimpan kartu sampling ini?
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                          <button
                                                onClick={() => setShowConfirmation(false)}
                                                className="px-4 py-2 rounded-lg transition-all"
                                                style={{
                                                      background: _cancelBtnBg,
                                                      color: _inputTextColor,
                                                      border: `1px solid ${_borderSection}`,
                                                }}
                                          >
                                                Batal
                                          </button>
                                          <button
                                                onClick={confirmSubmit}
                                                className="px-6 py-2 rounded-lg font-medium text-white transition-all"
                                                style={{ background: _btnBg }}
                                          >
                                                Ya, Simpan
                                          </button>
                                    </div>
                              </div>
                        </div>
                  )}

                  {/* Loading Modal */}
                  <Modal isOpen={isOpen} onClose={onClose} isCentered>
                        <ModalOverlay />
                        <ModalContent
                              style={{
                                    background: _bgCard,
                                    border: `1px solid ${_borderSection}`,
                              }}
                        >
                              <ModalBody className="text-center py-8">
                                    <Spinner size="xl" style={{ color: _spinnerBorder }} />
                                    <Text mt={4} style={{ color: _textSection }}>
                                          Sedang menyimpan data...
                                    </Text>
                              </ModalBody>
                        </ModalContent>
                  </Modal>
            </div>
      );
}

// Component Input
const Input = ({
      label,
      name,
      type = "text",
      value,
      onChange,
      onKeyDown,
      error,
      required = false,
      maxLength,
      inputBorder,
      inputBg,
      inputFocus,
      errorBg,
      errorBorder,
      inputTextColor,
}) => (
      <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: inputTextColor }}>
                  {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                  type={type}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                  maxLength={maxLength}
                  className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
                  style={{
                        borderColor: error ? errorBorder : inputBorder,
                        background: error ? errorBg : inputBg,
                        color: inputTextColor,
                        boxShadow: error ? `0 0 0 1px ${errorBorder}` : "none",
                  }}
                  onFocus={(e) => {
                        e.target.style.borderColor = inputFocus;
                        e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`;
                  }}
                  onBlur={(e) => {
                        e.target.style.borderColor = error ? errorBorder : inputBorder;
                        e.target.style.boxShadow = error ? `0 0 0 1px ${errorBorder}` : "none";
                  }}
            />
            {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
      </div>
);

// Component Select
const Select = ({
      label,
      name,
      value,
      onChange,
      options,
      required = false,
      inputBorder,
      inputBg,
      selectOptionColor,
      inputTextColor,
}) => (
      <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: inputTextColor }}>
                  {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                  name={name}
                  value={value}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
                  style={{
                        borderColor: inputBorder,
                        background: inputBg,
                        color: inputTextColor,
                  }}
            >
                  {options.map((option) => (
                        <option key={option.value} value={option.value} style={{ color: selectOptionColor }}>
                              {option.label}
                        </option>
                  ))}
            </select>
      </div>
);

// Component TextArea
const TextArea = ({
      label,
      name,
      value,
      onChange,
      error,
      maxLength,
      inputBorder,
      inputBg,
      inputFocus,
      errorBg,
      errorBorder,
      inputTextColor,
}) => (
      <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: inputTextColor }}>
                  {label}
            </label>
            <textarea
                  name={name}
                  value={value}
                  onChange={onChange}
                  maxLength={maxLength}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 resize-none"
                  style={{
                        borderColor: error ? errorBorder : inputBorder,
                        background: error ? errorBg : inputBg,
                        color: inputTextColor,
                        boxShadow: error ? `0 0 0 1px ${errorBorder}` : "none",
                  }}
                  onFocus={(e) => {
                        e.target.style.borderColor = inputFocus;
                        e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`;
                  }}
                  onBlur={(e) => {
                        e.target.style.borderColor = error ? errorBorder : inputBorder;
                        e.target.style.boxShadow = error ? `0 0 0 1px ${errorBorder}` : "none";
                  }}
            />
            {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
      </div>
);

// Component Section
const Section = ({
      title,
      children,
      isExpanded,
      onToggle,
      borderSection,
      sectionBg,
      sectionHover,
      textSection,
}) => (
      <div
            className="border rounded-lg overflow-hidden transition-all duration-300"
            style={{ borderColor: borderSection }}
      >
            <button
                  type="button"
                  onClick={onToggle}
                  className="w-full px-4 py-3 flex justify-between items-center font-medium transition-all hover:shadow-md"
                  style={{
                        background: isExpanded ? sectionBg : sectionBg,
                        color: textSection,
                  }}
                  onMouseEnter={(e) => {
                        e.target.style.background = sectionHover;
                  }}
                  onMouseLeave={(e) => {
                        e.target.style.background = sectionBg;
                  }}
            >
                  <span>{title}</span>
                  <span className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                  </span>
            </button>

            {isExpanded && (
                  <div className="p-4 space-y-4" style={{ background: sectionBg }}>
                        {children}
                  </div>
            )}
      </div>
);