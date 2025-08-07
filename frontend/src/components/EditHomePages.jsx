import { useState, useRef, useEffect } from "react";
import { Users, Microscope, Package, Clipboard, ChevronDown, ChevronUp, X, Edit, Save, Plus, Trash2, Eye, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Custom Box icon component
function Box(props) {
      return (
            <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={props.size || 24}
                  height={props.size || 24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
            >
                  <path d="M21 8V21H3V8"></path>
                  <path d="M1 3h22v5H1z"></path>
                  <path d="M10 12h4"></path>
            </svg>
      );
}

const iconMap = {
      Clipboard,
      Package,
      Box,
      Microscope,
      Users
};

const defaultContent = {
      hero_title: "Quality Control Team",
      hero_subtitle: "Driven by the spirit of Collaborative Excellence",
      about_description: "We are the Quality Control team, united to uphold quality and accelerate innovation at every step. Through collaboration, testing, and continuous improvement, we ensure that every detail meets the highest standards before moving forward.",
      mission_text: "One Team, One Mission — Together, we strive to deliver outstanding products and the best possible experience for everyone.",
};



const API_BASE = process.env.REACT_APP_API_BASE_URL;

// File upload utility function
const uploadFileToBackend = async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
            const response = await fetch(`${API_BASE}/api/uploadToGdrive`, {
                  method: 'POST',
                  // credentials: 'include',
                  // withCredentials: true,
                  body: formData,
            });

            if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Failed to upload file');
            }

            const data = await response.json();
            return data.downloadLink; // Google Drive URL
      } catch (error) {
            console.error('Upload error:', error);
            throw error;
      }
};

export default function QCTeamEditor() {
      const [activeTab, setActiveTab] = useState('content');
      const [personnel, setPersonnel] = useState([]);
      const [companyImages, setCompanyImages] = useState([]);
      const [content, setContent] = useState(defaultContent);
      const [previewMode, setPreviewMode] = useState(false);
      const [divisions, setDivisions] = useState([]);
      const [divisionMembers, setDivisionMembers] = useState([]);
      const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(null);

      // Loading and save states
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [saveStatus, setSaveStatus] = useState(null);
      const [saveMessage, setSaveMessage] = useState('');
      const placeholderImage = "/public/default-image.png"; // Placeholder image URL

      // File input refs
      const fileInputRefs = useRef([]);
      const personnelFileInputRefs = useRef([]);

      // Load initial data
      useEffect(() => {
            loadHomePagesData();
      }, []);

      // Function to extract file ID from Google Drive URL
     function extractFileId(url) {
    if (!url) return null;

    // Menangani berbagai format URL Google Drive
    const match = url.match(/\/file\/d\/([^/]+)/) ||
          url.match(/id=([^&]+)/) ||
          url.match(/\/([^/]{33})[^/]*$/);

    return match ? match[1] : null;
}

      // API Functions
      const loadHomePagesData = async () => {
            try {
                  setIsLoading(true);
                  const response = await fetch(`${API_BASE}/HomeEditing/HomePages`, {
                        credentials: 'include',
                        withCredentials: true,
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to load data');
                  }

                  const data = await response.json();

                  setPersonnel(data.personnel || []);
                  setCompanyImages(data.companyImages || []);
                  setDivisions(data.divisions || []);
                  setDivisionMembers(data.divisionMembers || []);
                  setContent(data.pageContent || defaultContent);
            } catch (error) {
                  console.error('Error loading data:', error);
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to load data from server');
            } finally {
                  setIsLoading(false);
            }
      };

      // Content editing functions
      const updateContent = (key, value) => {
            setContent(prev => ({ ...prev, [key]: value }));
      };

      const saveContent = async () => {
            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/content`, {
                        method: 'PUT',
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(content)
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save content');
                  }
                  return await response.json();
            } catch (error) {
                  throw new Error(`Failed to save content: ${error.message}`);
            }
      };

      // Personnel functions
      const addPersonnel = async () => {
            const newPerson = {
                  name: "New Team Member",
                  role: "Role Title",
                  image_url: ""
            };

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/personnel`, {
                        method: 'POST',
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newPerson)
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to add personnel');
                  }
                  await loadHomePagesData();
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to add personnel');
            }
      };

      const updatePersonnel = (index, field, value) => {
            const updated = [...personnel];
            updated[index][field === 'image' ? 'image_url' : field] = value;
            setPersonnel(updated);
      };

      const handlePersonnelImageFileChange = async (index, e) => {
            const file = e.target.files[0];
            if (file) {
                  const formData = new FormData();
                  formData.append("image", file); // Gunakan "image" bukan "file"

                  try {
                        const response = await fetch(`${API_BASE}/api/uploadToGDrive`, {
                              method: "POST",
                              credentials: "include",
                              body: formData,
                        });

                        if (!response.ok) throw new Error("Upload failed");

                        const data = await response.json();
                        updatePersonnel(index, "image", data.downloadLink);
                  } catch (error) {
                        console.error("Upload error:", error);
                  }
            }
      };


      const deletePersonnel = async (index) => {
            const person = personnel[index];
            if (!person.id) {
                  setPersonnel(personnel.filter((_, i) => i !== index));
                  return;
            }

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/personnel/${person.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        withCredentials: true,
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete personnel');
                  }
                  setPersonnel(personnel.filter((_, i) => i !== index));
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to delete personnel');
            }
      };

      const savePersonnel = async (person) => {
            try {
                  const method = person.id ? 'PUT' : 'POST';
                  const url = person.id
                        ? `${API_BASE}/HomeEditing/edit-home-pages/personnel/${person.id}`
                        : `${API_BASE}/HomeEditing/edit-home-pages/personnel`;

                  const response = await fetch(url, {
                        method,
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              name: person.name,
                              role: person.role,
                              image_url: person.image_url || ""
                        })
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save personnel');
                  }
                  return await response.json();
            } catch (error) {
                  throw new Error(`Failed to save personnel: ${error.message}`);
            }
      };

      // Company Images functions
      const addCompanyImage = async () => {
            const newImage = {
                  url: "",
                  title: "New Facility Image",
                  description: "Description of the facility"
            };

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/company-image`, {
                        method: 'POST',
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newImage)
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to add company image');
                  }
                  await loadHomePagesData();
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to add company image');
            }
      };

      const updateCompanyImage = (index, field, value) => {
            const updated = [...companyImages];
            updated[index][field] = value;
            setCompanyImages(updated);
      };

      // Untuk company images
      const handleImageFileChange = async (index, e) => {
            const file = e.target.files[0];
            if (file) {
                  try {
                        setIsLoading(true);
                        const formData = new FormData();
                        formData.append("image", file);

                        // 1. Upload gambar
                        const uploadResponse = await fetch(`${API_BASE}/api/uploadToGdrive`, {
                              method: "POST",
                              body: formData,
                        });
                        const { downloadLink } = await uploadResponse.json();

                        // 2. Update state dengan URL baru
                        updateCompanyImage(index, "url", downloadLink);

                        // 3. Simpan ke database
                        await saveCompanyImage(companyImages[index]);

                  } catch (error) {
                        console.error("Upload error:", error);
                        setSaveStatus("error");
                        setSaveMessage("Gagal upload gambar");
                  } finally {
                        setIsLoading(false);
                  }
            }
      };

      const deleteCompanyImage = async (index) => {
            const image = companyImages[index];
            if (!image.id) {
                  setCompanyImages(companyImages.filter((_, i) => i !== index));
                  return;
            }

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/company-image/${image.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        withCredentials: true,
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete company image');
                  }
                  setCompanyImages(companyImages.filter((_, i) => i !== index));
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to delete company image');
            }
      };

      const saveCompanyImage = async (image) => {
            try {
                  const method = image.id ? 'PUT' : 'POST';
                  const url = image.id
                        ? `${API_BASE}/HomeEditing/edit-home-pages/company-image/${image.id}`
                        : `${API_BASE}/HomeEditing/edit-home-pages/company-image`;

                  const response = await fetch(url, {
                        method,
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              url: image.url || "",
                              title: image.title,
                              description: image.description
                        })
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save company image');
                  }
                  return await response.json();
            } catch (error) {
                  throw new Error(`Failed to save company image: ${error.message}`);
            }
      };

      // Division functions
      const addDivision = async () => {
            const newDivision = {
                  name: "New Division",
                  icon: "Package",
                  member_count: 0
            };

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/division`, {
                        method: 'POST',
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newDivision)
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to add division');
                  }
                  await loadHomePagesData();
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to add division');
            }
      };

      const updateDivision = (index, field, value) => {
            const updated = [...divisions];
            updated[index][field] = value;
            setDivisions(updated);
      };

      const deleteDivision = async (index) => {
            const division = divisions[index];
            if (!division.id) {
                  setDivisions(divisions.filter((_, i) => i !== index));
                  return;
            }

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/division/${division.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        withCredentials: true,
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete division');
                  }
                  setDivisions(divisions.filter((_, i) => i !== index));
                  setDivisionMembers(divisionMembers.filter(member => member.division_id !== division.id));
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to delete division');
            }
      };

      const saveDivision = async (division) => {
            try {
                  const method = division.id ? 'PUT' : 'POST';
                  const url = division.id
                        ? `${API_BASE}/HomeEditing/edit-home-pages/division/${division.id}`
                        : `${API_BASE}/HomeEditing/edit-home-pages/division`;

                  const response = await fetch(url, {
                        method,
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              name: division.name,
                              icon: division.icon,
                              member_count: division.member_count || 0
                        })
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save division');
                  }
                  return await response.json();
            } catch (error) {
                  throw new Error(`Failed to save division: ${error.message}`);
            }
      };

      // Division Members functions
      const getDivisionMembers = (divisionId) => {
            return divisionMembers.filter(member => member.division_id === divisionId);
      };

      const addDivisionMember = async (divisionId) => {
            const newMember = {
                  division_id: divisionId,
                  name: "New Member",
                  role: "Role",
                  image_url: ""
            };

            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/division-member`, {
                        method: 'POST',
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newMember)
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to add division member');
                  }
                  await loadHomePagesData();
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to add division member');
            }
      };

      const updateDivisionMember = (memberId, field, value) => {
            const updated = divisionMembers.map(member =>
                  member.id === memberId
                        ? { ...member, [field === 'image' ? 'image_url' : field]: value }
                        : member
            );
            setDivisionMembers(updated);
      };

      const handleDivisionMemberImageFileChange = async (memberId, e) => {
            const file = e.target.files[0];
            if (file) {
                  try {
                        setIsLoading(true);
                        const formData = new FormData();
                        formData.append("image", file);

                        // 1. Upload gambar
                        const uploadResponse = await fetch(`${API_BASE}/api/uploadToGdrive`, {
                              method: "POST",
                              body: formData,
                        });
                        const { downloadLink } = await uploadResponse.json();

                        // 2. Update state
                        updateDivisionMember(memberId, "image", downloadLink);

                        // 3. Cari member yang sesuai dan simpan ke database
                        const member = divisionMembers.find(m => m.id === memberId);
                        if (member) {
                              await saveDivisionMember({
                                    ...member,
                                    image_url: downloadLink
                              });
                        }

                  } catch (error) {
                        console.error("Upload error:", error);
                        alert(`Upload gagal: ${error.message}`);
                  } finally {
                        setIsLoading(false);
                  }
            }
      };
      const deleteDivisionMember = async (memberId) => {
            try {
                  const response = await fetch(`${API_BASE}/HomeEditing/edit-home-pages/division-member/${memberId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        withCredentials: true,
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete division member');
                  }
                  setDivisionMembers(divisionMembers.filter(member => member.id !== memberId));
            } catch (error) {
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to delete division member');
            }
      };

      const saveDivisionMember = async (member) => {
            try {
                  const method = member.id ? 'PUT' : 'POST';
                  const url = member.id
                        ? `${API_BASE}/HomeEditing/edit-home-pages/division-member/${member.id}`
                        : `${API_BASE}/HomeEditing/edit-home-pages/division-member`;

                  const response = await fetch(url, {
                        method,
                        credentials: 'include',
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              division_id: member.division_id,
                              name: member.name,
                              role: member.role,
                              image_url: member.image_url || ""
                        })
                  });

                  if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save division member');
                  }
                  return await response.json();
            } catch (error) {
                  throw new Error(`Failed to save division member: ${error.message}`);
            }
      };

      const getImageUrl = (fileId) => {
            return `${API_BASE}/homeEditing/stream/${fileId}`;
      };

      // Save all changes
      const handleSave = async () => {
            setIsSaving(true);
            setSaveStatus(null);
            setSaveMessage('');

            try {
                  // Save content
                  await saveContent();

                  // Save personnel
                  for (const person of personnel) {
                        await savePersonnel(person);
                  }

                  // Save company images
                  for (const image of companyImages) {
                        await saveCompanyImage(image);
                  }

                  // Save divisions
                  for (const division of divisions) {
                        await saveDivision(division);
                  }

                  // Save division members
                  for (const member of divisionMembers) {
                        await saveDivisionMember(member);
                  }

                  setSaveStatus('success');
                  setSaveMessage('All changes saved successfully!');

                  // Reload data to get updated IDs
                  await loadHomePagesData();

                  setTimeout(() => {
                        setSaveStatus(null);
                        setSaveMessage('');
                  }, 3000);

            } catch (error) {
                  console.error('Save error:', error);
                  setSaveStatus('error');
                  setSaveMessage(error.message || 'Failed to save changes. Please try again.');

                  setTimeout(() => {
                        setSaveStatus(null);
                        setSaveMessage('');
                  }, 5000);
            } finally {
                  setIsSaving(false);
            }
      };
      // Loading state
      if (isLoading) {
            return (
                  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
                        <div className="text-center">
                              <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
                              <p className="text-gray-600">Loading QC Team data...</p>
                        </div>
                  </div>
            );
      }

      if (previewMode) {
            return (
                  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                        {/* Preview Mode Header */}
                        <div className="fixed top-4 right-4 z-50 mt-20">
                              <button
                                    onClick={() => setPreviewMode(false)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
                              >
                                    <X size={16} />
                                    Exit Preview
                              </button>
                        </div>

                        {/* Hero Section */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                              <div className="absolute inset-0 bg-black/20"></div>
                              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                                    <div className="text-center text-white">
                                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                                                {content.hero_title}
                                          </h1>
                                          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                                                {content.hero_subtitle}
                                          </p>
                                    </div>
                              </div>
                        </div>

                        {/* About Section */}
                        <div className="py-16 lg:py-24">
                              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">About Us</h2>
                                    <p className="text-xl text-gray-600 leading-relaxed">
                                          {content.about_description}
                                    </p>
                              </div>
                        </div>

                        {/* Personnel Section */}
                        <div className="py-16 lg:py-24 bg-white/50 backdrop-blur-sm">
                              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">Key Personnel</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                                          {personnel.map((person, index) => (
                                                <div key={person.id || index} className="text-center group">
                                                      <div className="relative mb-6">
                                                            {person.image_url ? (
                                                                  <img
                                                                        src={person.image_url ? getImageUrl(extractFileId(person.image_url)) : placeholderImage}
                                                                        alt={person.name}
                                                                        className="w-32 h-32 rounded-full mx-auto object-cover shadow-xl group-hover:shadow-2xl transition-all duration-300"
                                                                  />
                                                            ) : (
                                                                  <div className="w-32 h-32 rounded-full mx-auto bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-xl">
                                                                        <Users size={40} className="text-gray-400" />
                                                                  </div>
                                                            )}
                                                      </div>
                                                      <h3 className="text-xl font-bold text-gray-900 mb-2">{person.name}</h3>
                                                      <p className="text-gray-600">{person.role}</p>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        </div>

                        {/* Divisions Section */}
                        <div className="py-16 lg:py-24">
                              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <div className="text-center mb-16">
                                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Divisions</h2>
                                          <p className="text-xl text-gray-600">Click on any division to view team members</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                          {divisions.map((division, index) => {
                                                const IconComponent = iconMap[division.icon] || Package;
                                                const isExpanded = selectedDivisionIndex === index;
                                                const members = getDivisionMembers(division.id);

                                                return (
                                                      <div
                                                            key={division.id || index}
                                                            className={`bg-gradient-to-br from-blue-50 to-blue-100 border border-white/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                                                            onClick={() => setSelectedDivisionIndex(isExpanded ? null : index)}
                                                      >
                                                            <div className="flex items-center justify-between mb-4">
                                                                  <div className="flex items-center gap-4">
                                                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                                              <IconComponent size={24} />
                                                                        </div>
                                                                        <div>
                                                                              <h3 className="text-lg font-bold text-blue-700">{division.name}</h3>
                                                                              <p className="text-sm text-gray-600">{members.length} members</p>
                                                                        </div>
                                                                  </div>
                                                                  {isExpanded ? <ChevronUp className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                                                            </div>

                                                            {isExpanded && (
                                                                  <div className="mt-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                                        {members.map((member) => (
                                                                              <div key={member.id} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                                                                                    {member.image_url ? (
                                                                                          <img src={getImageUrl(extractFileId(member.image_url))} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
                                                                                    ) : (
                                                                                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                                                                <Users size={16} className="text-gray-400" />
                                                                                          </div>
                                                                                    )}
                                                                                    <div>
                                                                                          <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                                                                          <p className="text-xs text-gray-600">{member.role}</p>
                                                                                    </div>
                                                                              </div>
                                                                        ))}
                                                                  </div>
                                                            )}
                                                      </div>
                                                );
                                          })}
                                    </div>
                              </div>
                        </div>

                        {/* Facilities Section */}
                        <div className="py-16 lg:py-24 bg-white/50 backdrop-blur-sm">
                              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <div className="text-center mb-16">
                                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Facilities</h2>
                                          <p className="text-xl text-gray-600">Take a look inside our world-class facilities where innovation meets precision</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          {companyImages.map((image, index) => (
                                                <div key={image.id || index} className="group">
                                                      <div className="relative overflow-hidden rounded-2xl shadow-xl">
                                                            <img
                                                                   src={getImageUrl(extractFileId(image.url))}
                                                                  alt={image.title}
                                                                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                                                  <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                                                                  <p className="text-sm text-gray-200">{image.description}</p>
                                                            </div>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        </div>

                        {/* Mission Section */}
                        <div className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Our Mission</h2>
                                    <p className="text-xl text-blue-100 leading-relaxed">
                                          {content.mission_text}
                                    </p>
                              </div>
                        </div>
                  </div>
            );
      }

      return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 mt-20">
                  {/* Header */}
                  <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
                                    <div>
                                          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                                                QC Team Editor
                                          </h1>
                                          <p className="text-sm text-gray-600 mt-1 hidden sm:block">Manage your Quality Control team information</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                          <button
                                                onClick={() => setPreviewMode(true)}
                                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                          >
                                                <Eye size={16} />
                                                <span className="hidden sm:inline">Preview</span>
                                          </button>
                                          <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className={`${isSaving
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : saveStatus === 'success'
                                                                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                                                  : saveStatus === 'error'
                                                                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                                      } text-white px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium`}
                                          >
                                                {isSaving ? (
                                                      <Loader2 size={16} className="animate-spin" />
                                                ) : saveStatus === 'success' ? (
                                                      <CheckCircle size={16} />
                                                ) : saveStatus === 'error' ? (
                                                      <AlertCircle size={16} />
                                                ) : (
                                                      <Save size={16} />
                                                )}
                                                <span className="hidden sm:inline">
                                                      {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                                                </span>
                                          </button>
                                    </div>
                              </div>

                              {/* Save Status Message */}
                              {saveMessage && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm ${saveStatus === 'success'
                                                ? 'bg-green-50 text-green-800 border border-green-200'
                                                : 'bg-red-50 text-red-800 border border-red-200'
                                          }`}>
                                          <div className="flex items-center gap-2">
                                                {saveStatus === 'success' ? (
                                                      <CheckCircle size={16} />
                                                ) : (
                                                      <AlertCircle size={16} />
                                                )}
                                                {saveMessage}
                                          </div>
                                    </div>
                              )}
                        </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/30">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                              <nav className="flex overflow-x-auto">
                                    {[
                                          { id: 'content', label: 'Content', icon: Edit },
                                          { id: 'personnel', label: 'Personnel', icon: Users },
                                          { id: 'divisions', label: 'Divisions', icon: Package },
                                          { id: 'images', label: 'Images', icon: Eye }
                                    ].map(tab => {
                                          const IconComponent = tab.icon;
                                          return (
                                                <button
                                                      key={tab.id}
                                                      onClick={() => setActiveTab(tab.id)}
                                                      className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                                                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                                                            }`}
                                                >
                                                      <IconComponent size={16} />
                                                      {tab.label}
                                                </button>
                                          );
                                    })}
                              </nav>
                        </div>
                  </div>

                  {/* Content Area */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Content Tab */}
                        {activeTab === 'content' && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                <Edit size={20} className="text-white" />
                                          </div>
                                          <h2 className="text-2xl font-bold text-gray-900">Edit Page Content</h2>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                          <div className="space-y-6">
                                                <div className="group">
                                                      <label className="block text-sm font-semibold text-gray-700 mb-3">Hero Title</label>
                                                      <input
                                                            type="text"
                                                            value={content.hero_title}
                                                            onChange={(e) => updateContent('hero_title', e.target.value)}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-gray-300"
                                                      />
                                                </div>

                                                <div className="group">
                                                      <label className="block text-sm font-semibold text-gray-700 mb-3">Hero Subtitle</label>
                                                      <input
                                                            type="text"
                                                            value={content.hero_subtitle}
                                                            onChange={(e) => updateContent('hero_subtitle', e.target.value)}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-gray-300"
                                                      />
                                                </div>

                                                <div className="group">
                                                      <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Mission Statement</label>
                                                      <textarea
                                                            value={content.mission_text}
                                                            onChange={(e) => updateContent('mission_text', e.target.value)}
                                                            rows={4}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 resize-none"
                                                      />
                                                </div>
                                          </div>

                                          <div>
                                                <div className="group">
                                                      <label className="block text-sm font-semibold text-gray-700 mb-3">About Description</label>
                                                      <textarea
                                                            value={content.about_description}
                                                            onChange={(e) => updateContent('about_description', e.target.value)}
                                                            rows={8}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 resize-none"
                                                      />
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        )}

                        {/* Personnel Tab */}
                        {activeTab === 'personnel' && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                          <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                      <Users size={20} className="text-white" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">Personnel Management</h2>
                                          </div>
                                          <button
                                                onClick={addPersonnel}
                                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                          >
                                                <Plus size={16} />
                                                Add Person
                                          </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {personnel.map((person, index) => (
                                                <div key={person.id || index} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 group">
                                                      <div className="flex justify-between items-start mb-6">
                                                            <div className="relative">
                                                                  {person.image_url ? (
                                                                        <img src={person.image_url} alt={person.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                                                                  ) : (
                                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shadow-md">
                                                                              <Users size={20} />
                                                                        </div>
                                                                  )}
                                                            </div>
                                                            <button
                                                                  onClick={() => deletePersonnel(index)}
                                                                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                            >
                                                                  <Trash2 size={16} />
                                                            </button>
                                                      </div>

                                                      <div className="space-y-4">
                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Name</label>
                                                                  <input
                                                                        type="text"
                                                                        value={person.name}
                                                                        onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm"
                                                                  />
                                                            </div>

                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Role</label>
                                                                  <input
                                                                        type="text"
                                                                        value={person.role}
                                                                        onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm"
                                                                  />
                                                            </div>

                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Image</label>
                                                                  <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        ref={el => personnelFileInputRefs.current[index] = el}
                                                                        onChange={e => handlePersonnelImageFileChange(index, e)}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                                  />
                                                                  {isLoading && (
                                                                        <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                                                              <Loader2 size={12} className="animate-spin" />
                                                                              Uploading image...
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        )}

                        {/* Divisions Tab */}
                        {activeTab === 'divisions' && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                          <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                      <Package size={20} className="text-white" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">Division Management</h2>
                                          </div>
                                          <button
                                                onClick={addDivision}
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                          >
                                                <Plus size={16} />
                                                Add Division
                                          </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                          {divisions.map((division, index) => {
                                                const IconComponent = iconMap[division.icon] || Package;
                                                const members = getDivisionMembers(division.id);
                                                return (
                                                      <div key={division.id || index} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                                                            <div className="flex items-center justify-between mb-6">
                                                                  <div className="flex items-center gap-4">
                                                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                                              <IconComponent size={24} />
                                                                        </div>
                                                                        <div>
                                                                              <h3 className="text-lg font-bold text-gray-900">{division.name}</h3>
                                                                              <p className="text-sm text-gray-500">{members.length} members</p>
                                                                        </div>
                                                                  </div>
                                                                  <button
                                                                        onClick={() => deleteDivision(index)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                                  >
                                                                        <Trash2 size={16} />
                                                                  </button>
                                                            </div>

                                                            <div className="space-y-4 mb-6">
                                                                  <div>
                                                                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Division Name</label>
                                                                        <input
                                                                              type="text"
                                                                              value={division.name}
                                                                              onChange={(e) => updateDivision(index, 'name', e.target.value)}
                                                                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm"
                                                                        />
                                                                  </div>

                                                                  <div>
                                                                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Icon</label>
                                                                        <select
                                                                              value={division.icon}
                                                                              onChange={(e) => updateDivision(index, 'icon', e.target.value)}
                                                                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm"
                                                                        >
                                                                              {Object.keys(iconMap).map(iconName => (
                                                                                    <option key={iconName} value={iconName}>{iconName}</option>
                                                                              ))}
                                                                        </select>
                                                                  </div>
                                                            </div>

                                                            {/* Division Members */}
                                                            <div className="border-t border-gray-200/50 pt-6">
                                                                  <div className="flex items-center justify-between mb-4">
                                                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Team Members</h4>
                                                                        <button
                                                                              onClick={() => addDivisionMember(division.id)}
                                                                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs font-medium flex items-center gap-1"
                                                                        >
                                                                              <Plus size={12} />
                                                                              Add Member
                                                                        </button>
                                                                  </div>

                                                                  <div className="space-y-3 max-h-64 overflow-y-auto">
                                                                        {members.map((member) => (
                                                                              <div key={member.id} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 flex gap-3 items-start">
                                                                                    <div className="flex-shrink-0">
                                                                                          {member.image_url ? (
                                                                                                <img src={member.image_url} alt={member.name} className="w-12 h-12 rounded-xl object-cover" />
                                                                                          ) : (
                                                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                                                                                                      <Users size={16} />
                                                                                                </div>
                                                                                          )}
                                                                                    </div>

                                                                                    <div className="flex-1 space-y-2">
                                                                                          <input
                                                                                                type="text"
                                                                                                value={member.name}
                                                                                                onChange={(e) => updateDivisionMember(member.id, 'name', e.target.value)}
                                                                                                placeholder="Member name"
                                                                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-xs"
                                                                                          />
                                                                                          <input
                                                                                                type="text"
                                                                                                value={member.role}
                                                                                                onChange={(e) => updateDivisionMember(member.id, 'role', e.target.value)}
                                                                                                placeholder="Member role"
                                                                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-xs"
                                                                                          />
                                                                                          <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={(e) => handleDivisionMemberImageFileChange(member.id, e)}
                                                                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                                                          />
                                                                                          {isLoading && (
                                                                                                <div className="text-xs text-blue-600 flex items-center gap-1">
                                                                                                      <Loader2 size={12} className="animate-spin" />
                                                                                                      Uploading...
                                                                                                </div>
                                                                                          )}
                                                                                    </div>

                                                                                    <button
                                                                                          onClick={() => deleteDivisionMember(member.id)}
                                                                                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                                                                    >
                                                                                          <Trash2 size={14} />
                                                                                    </button>
                                                                              </div>
                                                                        ))}
                                                                  </div>
                                                            </div>
                                                      </div>
                                                );
                                          })}
                                    </div>
                              </div>
                        )}

                        {/* Images Tab */}
                        {activeTab === 'images' && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                          <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                                      <Eye size={20} className="text-white" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">Facility Images</h2>
                                          </div>
                                          <button
                                                onClick={addCompanyImage}
                                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                          >
                                                <Plus size={16} />
                                                Add Image
                                          </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          {companyImages.map((image, index) => (
                                                <div key={image.id || index} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                                                      <div className="flex justify-between items-start mb-6">
                                                            <div className="relative w-full">
                                                                  {image.url ? (
                                                                        <img src={image.url} alt={image.title} className="w-full h-48 rounded-xl object-cover shadow-md" />
                                                                  ) : (
                                                                        <div className="w-full h-48 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shadow-md">
                                                                              <Eye size={32} />
                                                                        </div>
                                                                  )}
                                                            </div>
                                                            <button
                                                                  onClick={() => deleteCompanyImage(index)}
                                                                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 ml-4"
                                                            >
                                                                  <Trash2 size={16} />
                                                            </button>
                                                      </div>

                                                      <div className="space-y-4">
                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Title</label>
                                                                  <input
                                                                        type="text"
                                                                        value={image.title}
                                                                        onChange={(e) => updateCompanyImage(index, 'title', e.target.value)}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm"
                                                                  />
                                                            </div>

                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Description</label>
                                                                  <textarea
                                                                        value={image.description}
                                                                        onChange={(e) => updateCompanyImage(index, 'description', e.target.value)}
                                                                        rows={3}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm resize-none"
                                                                  />
                                                            </div>

                                                            <div>
                                                                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Image File</label>
                                                                  <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        ref={el => fileInputRefs.current[index] = el}
                                                                        onChange={e => handleImageFileChange(index, e)}
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                                                  />
                                                                  {isLoading && (
                                                                        <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                                                                              <Loader2 size={12} className="animate-spin" />
                                                                              Uploading image...
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
}