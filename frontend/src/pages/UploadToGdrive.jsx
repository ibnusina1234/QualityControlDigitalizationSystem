import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react";

const categories = [
  { label: "Foto Kemasan", value: "Kemasan" },
  { label: "Foto Label", value: "Label" },
  { label: "Foto Segel", value: "Segel" },
];

const packagingTypes = [
  { label: "Kemasan Primer", value: "Primer" },
  { label: "Kemasan Sekunder", value: "Sekunder" },
];

function UploadToDrivePage() {
  // Color mode values
  const _bgMain = useColorModeValue("#f9fafb", "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)");
  const _bgCard = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(17, 24, 39, 0.95)");
  const _borderSection = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
  const _sectionBg = useColorModeValue("linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", "linear-gradient(135deg, #1f2937 0%, #111827 100%)");
  const _sectionHover = useColorModeValue("linear-gradient(135deg, #c7d2fe 0%, #e9d5ff 100%)", "linear-gradient(135deg, #374151 0%, #1f2937 100%)");
  const _textSection = useColorModeValue("#1e293b", "#f1f5f9");
  const _inputBorder = useColorModeValue("rgba(139, 92, 246, 0.4)", "rgba(75, 85, 99, 0.8)");
  const _inputBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(31, 41, 55, 0.8)");
  const _inputFocus = useColorModeValue("#8b5cf6", "#a78bfa");
  const _resetBtnHover = useColorModeValue("rgba(219, 234, 254, 0.8)", "rgba(30, 58, 138, 0.3)");
  const _btnBg = useColorModeValue("linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)");
  const _cancelBtnBg = useColorModeValue("linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", "linear-gradient(135deg, #374151 0%, #4b5563 100%)");
  const _headerBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(17, 24, 39, 0.9)");
  const _headerText = useColorModeValue("#1e293b", "#f1f5f9");
  const _inputTextColor = useColorModeValue("#1e293b", "#e2e8f0");
  const _spinnerBorder = useColorModeValue("#8b5cf6", "#a78bfa");
  const _headerBtnColor = useColorModeValue("#6366f1", "#a78bfa");
  const _borderColorConfirm = useColorModeValue("rgba(139, 92, 246, 0.3)", "rgba(75, 85, 99, 0.6)");
  const _searchBtnBg = useColorModeValue("linear-gradient(135deg, #10b981 0%, #059669 100%)", "linear-gradient(135deg, #065f46 0%, #047857 100%)");
  const _pagesBtnBg = useColorModeValue("linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)");

  const [filesByCategory, setFilesByCategory] = useState(
    packagingTypes.reduce((acc, packaging) => {
      acc[packaging.value] = categories.reduce((catAcc, category) => {
        catAcc[category.value] = [null];
        return catAcc;
      }, {});
      return acc;
    }, {})
  );

  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e, packagingType, category, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB dalam byte
    
    const extension = file.name.split('.').pop().toLowerCase();
    const fileType = file.type;
    
    if (!allowedExtensions.includes(extension) || !allowedTypes.includes(fileType)) {
      toast.error("Format file tidak valid. Hanya JPG, JPEG, atau PNG yang diperbolehkan.");
      return;
    }
    
    if (file.size > maxSize) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }
    
    const newFiles = [...filesByCategory[packagingType][category]];
    newFiles[index] = file;
    setFilesByCategory(prev => ({
      ...prev,
      [packagingType]: { ...prev[packagingType], [category]: newFiles },
    }));
  };

  const addInputField = (packagingType, category) => {
    setFilesByCategory(prev => ({
      ...prev,
      [packagingType]: {
        ...prev[packagingType],
        [category]: [...prev[packagingType][category], null],
      },
    }));
  };

  const uploadFileToDrive = async (file, packagingType, category, retries = 2) => {
    const formData = new FormData();
    formData.append("imageFiles", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/cards/sampling-cards/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress((prev) => ({
              ...prev,
              [`${packagingType}-${category}`]: percent,
            }));
          },
        }
      );

      const uploadedUrl = response.data?.fileUrl;
      const driveId = response.data?.driveId;

      if (!uploadedUrl || !driveId || !file.name) {
        throw new Error("Upload gagal: data tidak lengkap dari server");
      }

      return {
        name: file.name,
        driveId: driveId,
        webViewLink: uploadedUrl,
        packaging_type: packagingType,
        photo_category: category,
      };

    } catch (error) {
      if (retries > 0) {
        console.warn(`Retry upload (${2 - retries + 1}) untuk file: ${file.name}`);
        return await uploadFileToDrive(file, packagingType, category, retries - 1);
      }
      throw error;
    }
  };

  const handleUploadAll = async () => {
    const uploadedLinks = [];
    setIsUploading(true);

    try {
      for (const { value: packagingType } of packagingTypes) {
        for (const { value: category } of categories) {
          const filesToUpload = filesByCategory[packagingType][category].filter(Boolean);

          if (filesToUpload.length === 0) continue;

          for (const file of filesToUpload) {
            const uploadedData = await uploadFileToDrive(file, packagingType, category);
            uploadedLinks.push(uploadedData);
          }
        }
      }

      if (uploadedLinks.length === 0) {
        throw new Error("Tidak ada file yang dipilih untuk di-upload");
      }

      localStorage.setItem("uploadedImageLinks", JSON.stringify(uploadedLinks));
      toast.success("Semua file berhasil di-upload!");
      setUploadSuccess(true);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal upload: " + (error?.message || "Unknown error"));
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div 
      className="min-h-screen w-full mt-20"
      style={{
        background: _bgMain,
        padding: '2rem 0'
      }}
    >
      <div className="max-w-4xl mx-auto p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center transition-all duration-300 mb-6 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{
            background: _headerBg,
            color: _headerBtnColor,
            border: `1px solid ${_borderColorConfirm}`
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
          
        <div 
          className="rounded-2xl shadow-2xl p-8 mb-8 backdrop-blur-md border transform hover:scale-[1.01] transition-all duration-300"
          style={{
            background: _bgCard,
            borderColor: _borderColorConfirm
          }}
        >
          <h2 
            className="text-3xl font-bold mb-8 pb-4 border-b"
            style={{
              color: _headerText,
              borderColor: _borderSection
            }}
          >
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Upload Gambar ke Google Drive
            </span>
          </h2>
          
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            {packagingTypes.map(({ label, value: packagingType }) => (
              <div 
                key={packagingType} 
                className="rounded-xl p-6 shadow-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                style={{
                  background: _sectionBg,
                  borderColor: _borderSection
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = _sectionHover}
                onMouseLeave={(e) => e.currentTarget.style.background = _sectionBg}
              >
                <h3 
                  className="text-xl font-bold mb-6 flex items-center"
                  style={{ color: _textSection }}
                >
                  <span className="inline-block w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 shadow-lg"></span>
                  {label}
                </h3>

                <div className="space-y-6">
                  {categories.map(({ label, value: category }) => (
                    <div 
                      key={category} 
                      className="rounded-lg p-5 shadow-md border backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                      style={{
                        background: _inputBg,
                        borderColor: _inputBorder
                      }}
                    >
                      <h4 
                        className="text-lg font-semibold mb-4 flex items-center"
                        style={{ color: _inputTextColor }}
                      >
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-2 shadow-md"></span>
                        {label}
                      </h4>

                      <div className="space-y-4">
                        {filesByCategory[packagingType][category].map((file, index) => (
                          <div key={index} className="relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <div className="flex-1 w-full">
                                <label 
                                  className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm"
                                  style={{
                                    borderColor: _inputBorder,
                                    background: _inputBg,
                                    color: _inputTextColor
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = _inputFocus;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = _inputBorder;
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, packagingType, category, index)}
                                    className="sr-only"
                                  />
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {file ? (
                                    <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                                  ) : (
                                    <span className="text-sm font-medium opacity-70">Pilih Gambar</span>
                                  )}
                                </label>
                              </div>
                            </div>

                            {uploadProgress[`${packagingType}-${category}`] !== undefined && (
                              <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden shadow-inner">
                                <div
                                  className="h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                                  style={{
                                    width: `${uploadProgress[`${packagingType}-${category}`]}%`,
                                    background: _btnBg
                                  }}
                                >
                                  <span className="sr-only">{uploadProgress[`${packagingType}-${category}`]}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => addInputField(packagingType, category)}
                          className="flex items-center text-sm font-semibold transition-all duration-300 mt-4 px-4 py-2 rounded-lg hover:shadow-md transform hover:scale-105"
                          style={{
                            color: _headerBtnColor,
                            background: _resetBtnHover
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Tambah Gambar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {!uploadSuccess && (
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-2xl ${
                isUploading 
                  ? "cursor-not-allowed opacity-60" 
                  : ""
              }`}
              style={{
                background: isUploading ? _cancelBtnBg : _searchBtnBg,
                color: "white"
              }}
            >
              {isUploading && (
                <div
                  className="animate-spin h-6 w-6 mr-3 rounded-full border-4 border-solid border-transparent"
                  style={{
                    borderTopColor: _spinnerBorder,
                    borderRightColor: _spinnerBorder
                  }}
                ></div>
              )}
              {isUploading ? "Sedang Mengupload..." : "Upload Semua Gambar"}
            </button>
          )}

          {uploadSuccess && (
            <button
              onClick={() => navigate("/EditSamplingCard")}
              className="flex items-center px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                background: _pagesBtnBg,
                color: "white"
              }}
            >
              <span>Lanjut ke Formulir</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadToDrivePage;