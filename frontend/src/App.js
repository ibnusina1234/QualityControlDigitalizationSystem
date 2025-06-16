import React, { useEffect, useCallback } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import Dashboard from "./pages/DashboardSuhu";
import DashboardInstrument from "./pages/DasboardInstumen";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import EditProfile from "./pages/Edit";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import RequestPasswordReset from "./pages/RequestPasswordReset";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutUs from "./pages/AboutUs";
import AdminApproval from "./pages/AdminApproval";
import AdminPages from "./pages/AdminPages";
import KelolaUser from "./components/KelolaUser";
import LogActivity from "./pages/LogActivity";
import HistoricalPLC from "./pages/HistoricalPLC";
import { logout } from "./redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import AuthLoader from "./utils/authLoader";
import SampleMonitoringDashboard from "./pages/DashboardSampelRMPM";
import LogbookLabQC from "./components/Logbook";
import KartuSampling from "./components/KartuSampling";
import ListSamplingCard from "./pages/ListSamplingCard";
import EditSamplingCard from "./pages/EditSamplingCard";
import ApprovalsSamplingCard from "./pages/ApprovalsSamplingCard";
import UploadToGdrive from "./pages/UploadToGdrive";
import SamplingHistory from "./components/KartuSamplingHal2";
import SamplingHistoryForm from "./pages/SamplingHistroyForm";
import GalleryPDFFormat from "./components/FormatPdfForGalerry";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const user = useSelector((state) => state.user.user); // ✅ ambil user dari Redux
  const userId = user?.id;
  const userRole = user?.userrole;

  const isLoginOrRegisterOrResetPassword =
    location.pathname === "/Login" ||
    location.pathname === "/Register" ||
    location.pathname === "/request-password-reset";

  // ✅ Handle Logout
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/Dashboard");
  }, [dispatch, navigate]);

  // ✅ Redirect default
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/Dashboard");
    }
  }, [location.pathname, navigate]);

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {!isLoginOrRegisterOrResetPassword && (
        <Navbar
          isLoggedIn={false}
          handleLogout={handleLogout}
          userRole={userRole}
          users={[user]} // jika Navbar masih butuh array
        />
      )}

      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/DashboardInstrument" element={<DashboardInstrument />} />
        <Route
          path="/DashboardSampelRMPM"
          element={<SampleMonitoringDashboard />}
        />
        <Route
          path="/request-password-reset"
          element={<RequestPasswordReset />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/Login" element={<Login />} />
        <Route
          path="/Edit"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <EditProfile userId={userId} />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/HistoricalPLC"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <HistoricalPLC userId={userId} />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/LogbookLabQC"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <LogbookLabQC userId={userId} />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/AdminApproval"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminApproval />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/AdminPages"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminPages />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/LogActivity"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <LogActivity />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/UploadToGdrive"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <UploadToGdrive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/KartuSampling/:id"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <KartuSampling />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/ListSamplingCard"
          element={
            <AuthLoader>
                  <ProtectedRoute isLoggedIn={isLoggedIn}>
                <ListSamplingCard />
                </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/EditSamplingCard"
          element={
            <AuthLoader>
                <EditSamplingCard />{" "}
            </AuthLoader>
          }
        />
        <Route
          path="/SamplingHistory/:cardNumber"
          element={<SamplingHistory />}
        />
        <Route path="/SamplingHistoryForm" element={<SamplingHistoryForm />} />
        <Route
          path="/ApprovalsSamplingCard"
          element={
            <AuthLoader>
                <ApprovalsSamplingCard />{" "}
            </AuthLoader>
          }
        />
        <Route path="/GalleryPDFFormat/:id" element={<GalleryPDFFormat />} />
        <Route
          path="/KelolaUser"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <KelolaUser />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/AdminApproval/:userId"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminApproval />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/Profile"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Profile userId={userId} />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
      </Routes>
    </ChakraProvider>
  );
}

export default App;
