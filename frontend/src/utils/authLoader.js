import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser, logout } from "../redux/userSlice";

const AuthLoader = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/auth/me`, {
          withCredentials: true,
        });

        dispatch(setUser({
          id: res.data.id,
          email: res.data.email,
          inisial: res.data.inisial,
          jabatan:res.data.jabatan,
          nama_lengkap: res.data.nama_lengkap,
          userrole: res.data.userrole,
          img: res.data.img,
          permissions: res.data.permissions,
        }));

        setAuthorized(true);
      } catch (error) {
        dispatch(logout());
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuth();
  }, [dispatch, navigate]);

  if (isLoading) {
    // Kamu bisa ganti ini dengan spinner loading kalau mau
    return null;
  }

  return authorized ? children : null;
};

export default AuthLoader;
