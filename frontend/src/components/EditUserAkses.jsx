import React, { useState, useEffect } from "react";

export default function AdminAccessModal({
  show,
  onClose,
  initialAccess = "",
  onSave,
  userName = ""
}) {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(initialAccess);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        
        // Fetch roles from the API
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/roles`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        // Assuming the API returns roles in the format { role_key: "user", role_name: "User " }
        const simplified = data.map(role => ({
          role_key: role.role_key,
          role_name: role.role_name
        }));
        setRoles(simplified);
        
      } catch (error) {
        console.error('Gagal fetch role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (show) {
      fetchRoles();
    }
  }, [show]);

  useEffect(() => {
    setSelected(initialAccess);
  }, [initialAccess, show]);

  const handleRoleSelect = (roleKey) => {
    setSelected(roleKey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(selected); // Pass the selected role_key to the parent
    }
    // Modal will close from the parent component after save is successful
  };

  const handleCancel = () => {
    setSelected(initialAccess); // Reset to initial value
    if (onClose) onClose();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 mt-20"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          onClick={handleCancel}
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
          Atur Role User&nbsp;
          <span className="text-blue-600">{userName}</span>
        </h2>

        {/* Current Role Info */}
        {initialAccess && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Role saat ini:</span> 
              <span className="font-semibold ml-1 capitalize">{initialAccess}</span>
            </p>
          </div>
        )}

        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Pilih role untuk user ini:
            </p>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Memuat roles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <label
                    key={role.role_key}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selected === role.role_key
                        ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
                        : "bg-gray-50 hover:bg-blue-50/60 border-2 border-transparent hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={selected === role.role_key}
                      onChange={() => handleRoleSelect(role.role_key)}
                      className="accent-blue-600 w-5 h-5"
                    />
                    <div className="flex-1">
                      <span
                        className={`block ${
                          selected === role.role_key
                            ? "font-semibold text-blue-700"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {role.role_name}
                      </span>
                      {role.role_key === "super admin" && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Akses penuh ke seluruh sistem
                        </span>
                      )}
                      {role.role_key === "admin" && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Akses administratif terbatas
                        </span>
                      )}
                      {role.role_key === "user" && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Akses standar pengguna
                        </span>
                      )}
                    </div>
                    {selected === role.role_key && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg width={12} height={12} fill="white" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Warning untuk perubahan role */}
          {selected && selected !== initialAccess && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ Role akan diubah dari <strong className="capitalize">{initialAccess}</strong> menjadi <strong className="capitalize">{selected}</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-base transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selected || isLoading}
            >
              {selected === initialAccess ? "Tutup" : "Simpan Role"}
            </button>
          </div>
        </div>
      </div>

      {/* Simple fade in animation */}
      <style>{`
        .animate-fadeIn { 
          animation: fadeIn .3s cubic-bezier(.16,1,.3,1); 
        }
        @keyframes fadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(32px) scale(0.95);
          }
          100% { 
            opacity: 1; 
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
