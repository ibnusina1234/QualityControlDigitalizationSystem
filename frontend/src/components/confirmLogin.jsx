import { useState } from 'react';
import { X, Lock, Mail } from 'lucide-react';
import axios from "axios";

export default function ApprovalLoginPopup({ onSuccess, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('http://10.126.15.141:8081/cards/verify-user', {
        email,
        password
      });

      console.log("✅ Login response", res.data); // Debug log

      const user = res.data?.user;
      if (!user) {
        setError("Login gagal: data user tidak ditemukan.");
        return;
      }

      if (!["SUPERVISOR QC", "MANAGER QC", "MANAGER QA"].includes(user.jabatan)) {
        setError("Anda tidak memiliki akses untuk approval ini");
      } else {
        onSuccess?.(user); // Callback ke parent
        onClose?.();       // Tutup popup
      }
    } catch (err) {
      console.error("❌ LOGIN ERROR", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login gagal: error tidak diketahui');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold text-gray-800">Konfirmasi Approval</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-gray-600 mb-4">
            Silahkan masukkan email dan password untuk melanjutkan approval
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md mr-2 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
