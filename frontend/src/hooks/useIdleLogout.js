import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const useIdleLogout = (logoutCallback, timeout = 3600000) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const handleActivity = async () => {
      clearTimeout(timer);

      try {
        // Perbarui token saat ada aktivitas
        await axios.post(
          "http://10.126.15.141:8081/users/updateToken",
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error("❌ Gagal memperbarui token:", err);
      }

      timer = setTimeout(() => {
        logoutCallback();
        navigate("/");
      }, timeout);
    };

    const events = ["mousemove", "mousedown", "click", "scroll", "keypress"];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    handleActivity(); // trigger awal

    return () => {
      clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [logoutCallback, timeout, navigate]);
};

export default useIdleLogout;
