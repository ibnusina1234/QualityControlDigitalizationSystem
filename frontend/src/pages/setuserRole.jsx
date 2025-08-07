import React, { useState, useEffect } from "react";
import axios from 'axios';

// Configure axios defaults for httpOnly cookies
axios.defaults.withCredentials = true;

// Modal Component for Role Access
function AdminAccessModal({
  show,
  onClose,
  initialAccess = [],
  onSave,
  roleName = "",
  accessOptions = []
}) {
  const [selected, setSelected] = useState(initialAccess);

  React.useEffect(() => {
    setSelected(initialAccess);
  }, [initialAccess, show]);

  const handleToggle = (key) => {
    setSelected((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === accessOptions.length) {
      setSelected([]);
    } else {
      setSelected(accessOptions.map((o) => o.key));
    }
  };

  const handleSubmit = () => {
    if (onSave) onSave(selected);
    if (onClose) onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors"
          onClick={onClose}
          aria-label="Tutup"
          type="button"
        >
          <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2 className="font-bold text-xl mb-4 tracking-tight text-gray-900">
          Atur Akses Role&nbsp;
          <span className="text-blue-600">{roleName}</span>
        </h2>
        <div>
          <div className="mb-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.length === accessOptions.length}
              onChange={handleSelectAll}
              id="selectAll"
              className="accent-blue-600 w-5 h-5"
            />
            <label
              htmlFor="selectAll"
              className="font-semibold text-gray-700 cursor-pointer"
            >
              Pilih Semua
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {accessOptions.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selected.includes(opt.key)
                    ? "bg-blue-50"
                    : "bg-gray-50 hover:bg-blue-50/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.key)}
                  onChange={() => handleToggle(opt.key)}
                  className="accent-blue-600 w-5 h-5"
                />
                <span
                  className={`${
                    selected.includes(opt.key)
                      ? "font-semibold text-blue-700"
                      : "font-medium text-gray-700"
                  }`}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-8 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow transition-all"
          >
            Simpan Akses
          </button>
        </div>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn .2s cubic-bezier(.16,1,.3,1); }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}

// Role Form Modal
function RoleFormModal({ show, onClose, role = null, onSave }) {
  const [formData, setFormData] = useState({
    role_key: '',
    role_name: '',
    description: '',
    icon: '👤'
  });

  const [errors, setErrors] = useState({});

  const emojiOptions = ['👤', '⚙️', '🔍', '🧪', '📦', '🦠', '💼', '📊', '🎯', '🔧', '📋', '🏆'];

  React.useEffect(() => {
    if (role) {
      setFormData({
        role_key: role.key || '',
        role_name: role.label || '',
        description: role.description || '',
        icon: role.icon || '👤'
      });
    } else {
      setFormData({
        role_key: '',
        role_name: '',
        description: '',
        icon: '👤'
      });
    }
    setErrors({});
  }, [role, show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.role_key.trim()) {
      newErrors.role_key = 'Key role harus diisi';
    } else if (!/^[a-z_]+$/.test(formData.role_key)) {
      newErrors.role_key = 'Key role hanya boleh huruf kecil dan underscore';
    }
    
    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Nama role harus diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors"
          onClick={onClose}
          aria-label="Tutup"
          type="button"
        >
          <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
        
        <h2 className="font-bold text-xl mb-6 tracking-tight text-gray-900">
          {role ? 'Edit Role' : 'Tambah Role Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role_key}
              onChange={(e) => handleInputChange('role_key', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.role_key ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="contoh: user_operator"
              disabled={!!role}
            />
            {errors.role_key && <p className="text-red-500 text-sm mt-1">{errors.role_key}</p>}
            <p className="text-gray-500 text-xs mt-1">
              Key unik untuk role (huruf kecil dan underscore)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role_name}
              onChange={(e) => handleInputChange('role_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.role_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="contoh: User Operator"
            />
            {errors.role_name && <p className="text-red-500 text-sm mt-1">{errors.role_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Deskripsi singkat tentang role ini"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInputChange('icon', emoji)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                    formData.icon === emoji
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {role ? 'Update Role' : 'Tambah Role'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn .2s cubic-bezier(.16,1,.3,1); }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}

// Permission Form Modal
function PermissionFormModal({ show, onClose, permission = null, onSave }) {
  const [formData, setFormData] = useState({
    permission_key: '',
    permission_name: '',
    description: '',
    category: ''
  });

  const [errors, setErrors] = useState({});

  const categoryOptions = [
    'Dashboard',
    'Users',
    'Reports',
    'Settings',
    'Quality Control',
    'Analysis',
    'Monitoring',
    'Administration'
  ];

  React.useEffect(() => {
    if (permission) {
      setFormData({
        permission_key: permission.key || '',
        permission_name: permission.label || '',
        description: permission.description || '',
        category: permission.category || ''
      });
    } else {
      setFormData({
        permission_key: '',
        permission_name: '',
        description: '',
        category: ''
      });
    }
    setErrors({});
  }, [permission, show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.permission_key.trim()) {
      newErrors.permission_key = 'Key permission harus diisi';
    } else if (!/^[a-z_]+$/.test(formData.permission_key)) {
      newErrors.permission_key = 'Key permission hanya boleh huruf kecil dan underscore';
    }
    
    if (!formData.permission_name.trim()) {
      newErrors.permission_name = 'Nama permission harus diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors"
          onClick={onClose}
          aria-label="Tutup"
          type="button"
        >
          <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
        
        <h2 className="font-bold text-xl mb-6 tracking-tight text-gray-900">
          {permission ? 'Edit Permission' : 'Tambah Permission Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Permission <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.permission_key}
              onChange={(e) => handleInputChange('permission_key', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.permission_key ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="contoh: view_dashboard"
              disabled={!!permission}
            />
            {errors.permission_key && <p className="text-red-500 text-sm mt-1">{errors.permission_key}</p>}
            <p className="text-gray-500 text-xs mt-1">
              Key unik untuk permission (huruf kecil dan underscore)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Permission <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.permission_name}
              onChange={(e) => handleInputChange('permission_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.permission_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="contoh: View Dashboard"
            />
            {errors.permission_name && <p className="text-red-500 text-sm mt-1">{errors.permission_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih kategori</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Deskripsi singkat tentang permission ini"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {permission ? 'Update Permission' : 'Tambah Permission'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn .2s cubic-bezier(.16,1,.3,1); }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}

// Confirmation Modal
function ConfirmationModal({ show, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!show) return null;

  const isDelete = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fadeIn">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            isDelete ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {isDelete ? (
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                isDelete 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isDelete ? 'Hapus' : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn .2s cubic-bezier(.16,1,.3,1); }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}

// Main Component
export default function UserAccessSettings() {
  const [activeTab, setActiveTab] = useState('roles');
  const [accessOptions, setAccessOptions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleAccess, setRoleAccess] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Modal states
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentEditRole, setCurrentEditRole] = useState(null);
  const [currentEditPermission, setCurrentEditPermission] = useState(null);
  const [confirmationData, setConfirmationData] = useState({});

  // API Base URL - sesuaikan dengan backend Anda
  const API_BASE = "http://localhost:8081/users";

   // Fetch all permissions and roles (with access) after mount
  useEffect(() => {
    fetchAllRolesAndPermissions();
  }, []);

  // --- PENARIKAN DATA DARI ENDPOINT SESUAI REQUEST ---
  const fetchAllRolesAndPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Permissions
      const permissionsRes = await axios.get(`${API_BASE}/permissions`, {
        withCredentials: true
      });
      // Map permissions sesuai response controller
      const mappedPermissions = permissionsRes.data.map(p => ({
        key: p.permission_key || p.key || p.id,
        label: p.permission_name || p.label || p.name || p.permission_key || p.key || p.id,
        description: p.description || '',
        category: p.category || ''
      }));
      setAccessOptions(mappedPermissions);

      // 2. Fetch Roles
      const rolesRes = await axios.get(`${API_BASE}/roles`, {
        withCredentials: true
      });
      // Map roles sesuai response controller
      const mappedRoles = rolesRes.data.map(r => ({
        key: r.role_key || r.key || r.id,
        label: r.role_name || r.name || r.label,
        icon: r.icon || '👤',
        description: r.description || ''
      }));
      setRoles(mappedRoles);

      // 3. Fetch Role Permissions (akses tiap role)
      // roleAccess = { [role_key]: [permission_key, ...] }
      const ra = {};
      for (const r of rolesRes.data) {
        const roleKey = r.role_key || r.key || r.id;
        // Fetch "permissions" for each role using endpoint GET /roles/:roleKey/permissions (optional, fallback ke property pada role)
        try {
          const permRelRes = await axios.get(`${API_BASE}/roles/${roleKey}/permissions`, {
            withCredentials: true
          });
          // Properti return: permissions: [permission_key, ...]
          ra[roleKey] = permRelRes.data.permissions || permRelRes.data.access || [];
        } catch (err) {
          // fallback jika endpoint tidak tersedia
          ra[roleKey] = r.access || r.permissions || r.rolePermissions || [];
        }
      }
      setRoleAccess(ra);

      setDebugInfo({
        permissionsRaw: permissionsRes.data,
        rolesRaw: rolesRes.data,
        mappedPermissions,
        mappedRoles,
        mappedRoleAccess: ra
      });

    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat data roles & permissions");
      if (err.response?.status === 401) {
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
      } else if (err.response?.status === 403) {
        setError("Anda tidak memiliki akses untuk melihat data ini.");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleEditRole = (role) => {
    setCurrentRole(role);
    setShowModal(true);
  };

  const handleSaveAccess = async (newAccess) => {
    if (currentRole) {
      try {
        await axios.put(`${API_BASE}/roles/${currentRole.key}/permissions`, {
          permissions: newAccess
        }, {
          withCredentials: true
        });
        
        setRoleAccess(prev => ({
          ...prev,
          [currentRole.key]: newAccess
        }));
        
        alert("Akses role berhasil disimpan!");
      } catch (err) {
        console.error('Error saving access:', err);
        
        if (err.response?.status === 401) {
          alert("Sesi Anda telah berakhir. Silakan login kembali.");
        } else if (err.response?.status === 403) {
          alert("Anda tidak memiliki akses untuk mengubah permissions.");
        } else {
          alert(err.response?.data?.message || "Gagal menyimpan akses role");
        }
      }
    }
  };

  const handleResetToDefault = async (roleKey) => {
    try {
      const res = await axios.get(`${API_BASE}/roles/${roleKey}/permissions`, {
        withCredentials: true
      });
      
      setRoleAccess(prev => ({
        ...prev,
        [roleKey]: res.data.permissions || res.data.access || []
      }));
      
      alert("Role berhasil direset ke pengaturan default!");
    } catch (err) {
      console.error('Error resetting to default:', err);
      
      if (err.response?.status === 401) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
      } else if (err.response?.status === 404) {
        alert("Role tidak ditemukan.");
      } else {
        alert(err.response?.data?.message || "Gagal reset ke default");
      }
    }
  };

    // Role CRUD operations
  const handleSaveRole = async (roleData) => {
    try {
      if (currentEditRole) {
        await axios.put(`${API_BASE}/roles/${currentEditRole.key}`, roleData, {
          withCredentials: true
        });
        alert("Role berhasil diupdate!");
      } else {
        await axios.post(`${API_BASE}/roles`, roleData, {
          withCredentials: true
        });
        alert("Role baru berhasil ditambahkan!");
      }
      setShowRoleForm(false);
      setCurrentEditRole(null);
      fetchAllRolesAndPermissions(); // <--- UPDATE TO NEW FUNCTION
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan role");
    }
  };

  const handleDeleteRole = async (roleKey) => {
    try {
      await axios.delete(`${API_BASE}/roles/${roleKey}`, {
        withCredentials: true
      });
      alert("Role berhasil dihapus!");
    fetchAllRolesAndPermissions();; // Refresh data
    } catch (err) {
      console.error('Error deleting role:', err);
      alert(err.response?.data?.message || "Gagal menghapus role");
    }
  };

  // Permission CRUD operations
 const handleSavePermission = async (permissionData) => {
    try {
      if (currentEditPermission) {
        await axios.put(`${API_BASE}/permissions/${currentEditPermission.key}`, permissionData, {
          withCredentials: true
        });
        alert("Permission berhasil diupdate!");
      } else {
        await axios.post(`${API_BASE}/permissions`, permissionData, {
          withCredentials: true
        });
        alert("Permission baru berhasil ditambahkan!");
      }
      setShowPermissionForm(false);
      setCurrentEditPermission(null);
      fetchAllRolesAndPermissions(); // <--- UPDATE TO NEW FUNCTION
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan permission");
    }
  };

  const handleDeletePermission = async (permissionKey) => {
    try {
      await axios.delete(`${API_BASE}/permissions/${permissionKey}`, {
        withCredentials: true
      });
      alert("Permission berhasil dihapus!");
      fetchAllRolesAndPermissions(); // <--- UPDATE TO NEW FUNCTION
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus permission");
    }
  };

  // Confirmation handlers
  const showDeleteConfirmation = (type, item) => {
    setConfirmationData({
      type,
      item,
      title: `Hapus ${type === 'role' ? 'Role' : 'Permission'}`,
      message: `Apakah Anda yakin ingin menghapus ${type === 'role' ? 'role' : 'permission'} "${item.label}"? Tindakan ini tidak dapat dibatalkan.`
    });
    setShowConfirmation(true);
  };

  const handleConfirmDelete = () => {
    const { type, item } = confirmationData;
    if (type === 'role') {
      handleDeleteRole(item.key);
    } else {
      handleDeletePermission(item.key);
    }
    setShowConfirmation(false);
    setConfirmationData({});
  };

  const getAccessCount = (roleKey) => {
    return roleAccess[roleKey]?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat data roles dan permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pengaturan Akses User berdasarkan Role
          </h1>
          <p className="text-gray-600">
            Kelola hak akses untuk setiap role pengguna dalam sistem
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles Management
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions Management
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
            </button>
          </nav>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manajemen Role</h2>
              <button
                onClick={() => {
                  setCurrentEditRole(null);
                  setShowRoleForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                </svg>
                Tambah Role Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div
                  key={role.key}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {role.label}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setCurrentEditRole(role);
                          setShowRoleForm(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Role"
                      >
                        <svg width={16} height={16} fill="none" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => showDeleteConfirmation('role', role)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Hapus Role"
                      >
                        <svg width={16} height={16} fill="none" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Access Summary */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Akses Aktif</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {getAccessCount(role.key)} / {accessOptions.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${accessOptions.length > 0 ? (getAccessCount(role.key) / accessOptions.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Access Preview */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Akses yang diberikan:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleAccess[role.key]?.slice(0, 3).map((accessKey) => {
                        const option = accessOptions.find(opt => opt.key === accessKey);
                        return option ? (
                          <span
                            key={accessKey}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {option.label}
                          </span>
                        ) : null;
                      })}
                      {roleAccess[role.key]?.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{roleAccess[role.key].length - 3} lainnya
                        </span>
                      )}
                      {(!roleAccess[role.key] || roleAccess[role.key].length === 0) && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          Tidak ada akses
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Edit Akses
                    </button>
                    <button
                      onClick={() => handleResetToDefault(role.key)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      title="Reset ke Default"
                    >
                      <svg width={16} height={16} fill="none" viewBox="0 0 24 24">
                        <path
                          d="M4 12a8 8 0 0 1 8-8V2.5L16 6l-4 3.5V8a6 6 0 1 0 6 6h1.5a7.5 7.5 0 1 1-7.5-7.5z"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manajemen Permission</h2>
              <button
                onClick={() => {
                  setCurrentEditPermission(null);
                  setShowPermissionForm(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                </svg>
                Tambah Permission Baru
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessOptions.map((permission) => (
                      <tr key={permission.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{permission.label}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                            {permission.key}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {permission.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {permission.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {permission.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setCurrentEditPermission(permission);
                                setShowPermissionForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit Permission"
                            >
                              <svg width={16} height={16} fill="none" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => showDeleteConfirmation('permission', permission)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Hapus Permission"
                            >
                              <svg width={16} height={16} fill="none" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {accessOptions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🔐</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Permission</h3>
                  <p className="text-gray-500 mb-4">Mulai dengan menambahkan permission pertama</p>
                  <button
                    onClick={() => {
                      setCurrentEditPermission(null);
                      setShowPermissionForm(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Tambah Permission
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ringkasan Pengaturan Akses
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    {accessOptions.map((option) => (
                      <th 
                        key={option.key} 
                        className="text-center py-3 px-2 font-semibold text-gray-700 text-xs relative group cursor-help"
                        title={option.label}
                      >
                        {option.label.split(' ').map(word => word.charAt(0)).join('')}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                          {option.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          {role.label}
                        </div>
                      </td>
                      {accessOptions.map((option) => (
                        <td key={option.key} className="text-center py-3 px-2">
                          {roleAccess[role.key]?.includes(option.key) ? (
                            <span className="inline-block w-4 h-4 bg-green-500 rounded-full"></span>
                          ) : (
                            <span className="inline-block w-4 h-4 bg-gray-300 rounded-full"></span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              💡 <strong>Tip:</strong> Arahkan kursor mouse (hover) pada singkatan di header kolom untuk melihat nama lengkap fitur
            </p>
          </div>
        )}

        {/* Debug Panel - Remove this in production */}
        {debugInfo && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info (Hapus di production)</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <div>
                <strong>Permissions Count:</strong> {accessOptions.length}
                {accessOptions.length === 0 && <span className="text-red-600 ml-2">⚠️ Tidak ada permissions!</span>}
              </div>
              <div>
                <strong>Roles Count:</strong> {roles.length}
              </div>
              <div>
                <strong>Role Access Keys:</strong> {Object.keys(roleAccess).join(', ') || 'None'}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Raw API Responses</summary>
                <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdminAccessModal
        show={showModal}
        onClose={() => setShowModal(false)}
        initialAccess={currentRole ? roleAccess[currentRole.key] || [] : []}
        onSave={handleSaveAccess}
        roleName={currentRole?.label || ""}
        accessOptions={accessOptions}
      />

      <RoleFormModal
        show={showRoleForm}
        onClose={() => {
          setShowRoleForm(false);
          setCurrentEditRole(null);
        }}
        role={currentEditRole}
        onSave={handleSaveRole}
      />

      <PermissionFormModal
        show={showPermissionForm}
        onClose={() => {
          setShowPermissionForm(false);
          setCurrentEditPermission(null);
        }}
        permission={currentEditPermission}
        onSave={handleSavePermission}
      />

      <ConfirmationModal
        show={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setConfirmationData({});
        }}
        onConfirm={handleConfirmDelete}
        title={confirmationData.title}
        message={confirmationData.message}
        type="danger"
      />
    </div>
  );
  }