import { useState, useRef } from "react";
import { Users, Microscope, Package, Clipboard, ChevronDown, ChevronUp, X, Edit, Save, Plus, Trash2 } from "lucide-react";

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

// Default data structure
const defaultPersonnel = [
  { name: "Agus Triyantoro", role: "Quality Head", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" },
  { name: "Carla Kuntari", role: "Quality Control", image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" },
  { name: "Cindy Manuela", role: "Finish Good Supervisor", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" },
  { name: "Lusiani Srinita", role: "Packaging Material & Stability Supervisor", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face" },
  { name: "Felicia Kowe", role: "Raw Material & Microbiology Supervisor", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face" },   
];

const defaultCompanyImages = [
  {
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=800&fit=crop",
    title: "State-of-the-art Laboratory",
    description: "Our modern laboratory facilities equipped with cutting-edge technology"
  },
  {
    url: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&h=800&fit=crop",
    title: "Quality Testing Process",
    description: "Rigorous testing procedures ensuring the highest quality standards"
  },
  {
    url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop",
    title: "Manufacturing Excellence",
    description: "Clean room environments maintaining sterile production conditions"
  },
  {
    url: "https://images.unsplash.com/photo-1581093458791-9f3c3250a657?w=1200&h=800&fit=crop",
    title: "Team Collaboration",
    description: "Our experts working together to achieve quality excellence"
  }
];

const defaultContent = {
  heroTitle: "Quality Control Team",
  heroSubtitle: "Driven by the spirit of Collaborative Excellence",
  aboutTitle: "About Us",
  aboutDescription: "We are the Quality Control team, united to uphold quality and accelerate innovation at every step. Through collaboration, testing, and continuous improvement, we ensure that every detail meets the highest standards before moving forward.",
  facilitiesTitle: "Our Facilities",
  facilitiesDescription: "Take a look inside our world-class facilities where innovation meets precision",
  personnelTitle: "Key Personnel",
  divisionsTitle: "Our Divisions",
  divisionsDescription: "Click on any division to view team members",
  missionTitle: "Our Mission",
  missionText: "One Team, One Mission — Together, we strive to deliver outstanding products and the best possible experience for everyone.",
};

const iconMap = {
  Clipboard,
  Package,
  Box,
  Microscope,
  Users
};

export default function QCTeamEditor() {
  const [activeTab, setActiveTab] = useState('content');
  const [personnel, setPersonnel] = useState(defaultPersonnel);
  const [companyImages, setCompanyImages] = useState(defaultCompanyImages);
  const [content, setContent] = useState(defaultContent);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Division data with editable member counts
  const [divisions, setDivisions] = useState([
    { 
      name: "Finish Good Team", 
      icon: "Clipboard", 
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      memberCount: 11
    },
    { 
      name: "Raw Material Team", 
      icon: "Package", 
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      bgColor: "from-emerald-50 to-emerald-100", 
      textColor: "text-emerald-700",
      memberCount: 7
    },
    { 
      name: "Packaging Material Team", 
      icon: "Box", 
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      textColor: "text-purple-700", 
      memberCount: 6
    },
    { 
      name: "Microbiology Team", 
      icon: "Microscope", 
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
      bgColor: "from-amber-50 to-amber-100",
      textColor: "text-amber-700",
      memberCount: 4
    },
    { 
      name: "Administration Team", 
      icon: "Users", 
      color: "bg-gradient-to-br from-rose-500 to-rose-600",
      bgColor: "from-rose-50 to-rose-100",
      textColor: "text-rose-700",
      memberCount: 2
    },
  ]);

  // Content editing functions
  const updateContent = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  // Personnel editing functions
  const addPersonnel = () => {
    const newPerson = {
      name: "New Team Member",
      role: "Role Title",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    };
    setPersonnel([...personnel, newPerson]);
  };

  const updatePersonnel = (index, field, value) => {
    const updated = [...personnel];
    updated[index][field] = value;
    setPersonnel(updated);
  };

  const deletePersonnel = (index) => {
    setPersonnel(personnel.filter((_, i) => i !== index));
  };

  // Company images editing functions
  const fileInputRefs = useRef([]);

  const addCompanyImage = () => {
    const newImage = {
      url: "",
      file: null,
      title: "New Facility Image",
      description: "Description of the facility"
    };
    setCompanyImages([...companyImages, newImage]);
  };

  const updateCompanyImage = (index, field, value) => {
    const updated = [...companyImages];
    updated[index][field] = value;
    setCompanyImages(updated);
  };

  const handleImageFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      const updated = [...companyImages];
      updated[index].url = localUrl;
      updated[index].file = file; // store file for export if needed
      setCompanyImages(updated);
    }
  };

  const deleteCompanyImage = (index) => {
    setCompanyImages(companyImages.filter((_, i) => i !== index));
  };

  // Division editing functions
  const updateDivision = (index, field, value) => {
    const updated = [...divisions];
    updated[index][field] = value;
    setDivisions(updated);
  };

  // For exporting, skip file blobs and only export data with links (not the local files)
  const exportData = () => {
    const exportedImages = companyImages.map(img => {
      // If image is a local file, we can't export the blob, so we leave url as is
      return {
        url: img.url,
        title: img.title,
        description: img.description
      };
    });
    const exportedData = {
      personnel,
      companyImages: exportedImages,
      content,
      divisions
    };
    const dataStr = JSON.stringify(exportedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qc-team-data.json';
    link.click();
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Preview Mode Header */}
        <div className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Preview Mode</h1>
          <button
            onClick={() => setPreviewMode(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Editor
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-center mb-4">{content.heroTitle}</h1>
            <p className="text-xl text-center text-gray-600 mb-8">{content.heroSubtitle}</p>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{content.aboutTitle}</h2>
              <p className="text-gray-700">{content.aboutDescription}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{content.personnelTitle}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {personnel.map((person, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center">
                    <img src={person.image} alt={person.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                    <h3 className="font-semibold text-sm">{person.name}</h3>
                    <p className="text-xs text-gray-600">{person.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{content.divisionsTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {divisions.map((division, idx) => {
                  const IconComponent = iconMap[division.icon];
                  return (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className={`w-12 h-12 ${division.color} rounded-full flex items-center justify-center text-white mx-auto mb-2`}>
                        <IconComponent size={20} />
                      </div>
                      <h3 className="font-semibold">{division.name}</h3>
                      <p className="text-sm text-gray-600">{division.memberCount} Members</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{content.facilitiesTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {companyImages.map((image, idx) => (
                  <div key={idx} className="bg-gray-100 rounded-lg overflow-hidden">
                    {image.url && <img src={image.url} alt={image.title} className="w-full h-40 object-cover" />}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{image.title}</h3>
                      <p className="text-gray-600 text-sm">{image.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">QC Team Page Editor</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setPreviewMode(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={exportData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8">
            {[
              { id: 'content', label: 'Content' },
              { id: 'personnel', label: 'Personnel' },
              { id: 'divisions', label: 'Divisions' },
              { id: 'images', label: 'Images' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Edit Page Content</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                <input
                  type="text"
                  value={content.heroTitle}
                  onChange={(e) => updateContent('heroTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                <input
                  type="text"
                  value={content.heroSubtitle}
                  onChange={(e) => updateContent('heroSubtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Description</label>
                <textarea
                  value={content.aboutDescription}
                  onChange={(e) => updateContent('aboutDescription', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
                <textarea
                  value={content.missionText}
                  onChange={(e) => updateContent('missionText', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Personnel Tab */}
        {activeTab === 'personnel' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Personnel</h2>
              <button
                onClick={addPersonnel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Person
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personnel.map((person, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <img src={person.image} alt={person.name} className="w-16 h-16 rounded-full object-cover" />
                    <button
                      onClick={() => deletePersonnel(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={person.role}
                        onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={person.image}
                        onChange={(e) => updatePersonnel(index, 'image', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divisions Tab */}
        {activeTab === 'divisions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Manage Divisions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {divisions.map((division, index) => {
                const IconComponent = iconMap[division.icon];
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${division.color} rounded-lg flex items-center justify-center text-white`}>
                        <IconComponent size={20} />
                      </div>
                      <h3 className="text-lg font-semibold">{division.name}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Division Name</label>
                        <input
                          type="text"
                          value={division.name}
                          onChange={(e) => updateDivision(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                        <input
                          type="number"
                          value={division.memberCount}
                          onChange={(e) => updateDivision(index, 'memberCount', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                        <select
                          value={division.icon}
                          onChange={(e) => updateDivision(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.keys(iconMap).map(iconName => (
                            <option key={iconName} value={iconName}>{iconName}</option>
                          ))}
                        </select>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Company Images</h2>
              <button
                onClick={addCompanyImage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Image
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companyImages.map((image, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    {image.url ? (
                      <img src={image.url} alt={image.title} className="w-20 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-20 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                    )}
                    <button
                      onClick={() => deleteCompanyImage(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={image.title}
                        onChange={(e) => updateCompanyImage(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={image.description}
                        onChange={(e) => updateCompanyImage(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={el => fileInputRefs.current[index] = el}
                        onChange={e => handleImageFileChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
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

// Missing Eye icon component
function Eye(props) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}