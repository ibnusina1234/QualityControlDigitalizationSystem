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
import RamanDashboard from "./pages/IdentifikasiRaman";
import RamanMonitoringDashboard from "./pages/DashboardRaman";
import AdminAccessChecklist from "./components/EditUserAkses";
import UserAccessSettings from "./pages/setuserRole";
import EditHomePages from "./components/EditHomePages";

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
  const userPermissions = user?.permissions;

  const isLoginOrRegisterOrResetPassword =
    location.pathname === "/Login" ||
    location.pathname === "/Register" ||
    location.pathname === "/request-password-reset" ||
    location.pathname === "/MicrobiologyReport";

  // ✅ Handle Logout
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/Dashboard");
  }, [dispatch, navigate]);

  // ✅ Redirect default
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/Home");
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
        <Route path="/MicrobiologyReport" element={<MicrobiologyReport />} />
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
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="edit_profil"
                userPermissions={userPermissions}
              >
                <EditProfile userId={userId} />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/HistoricalPLC"
          element={
            <AuthLoader>
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="historical_temperature_rh"
                userPermissions={userPermissions}
              >
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
          path="/MicrobiologyLogbook"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <MicrobiologyLogbook />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/LogbookMikroQC"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <LaboratoryMicrobiologyForm />
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
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="admin_pages"
                userPermissions={userPermissions}
              >
                <AdminPages />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/UserAccessSettings"
          element={
            <AuthLoader>
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="user_access_settings"
                userPermissions={userPermissions}
              >
                <UserAccessSettings />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/LogActivity"
          element={
            <AuthLoader>
             <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="log_activity"
                userPermissions={userPermissions}
              >
                <LogActivity />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/EditUserAkses"
          element={
            <AuthLoader>
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminAccessChecklist />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/UploadToGdrive"
          element={
            <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="create_ks"
                userPermissions={userPermissions}
              >
              <UploadToGdrive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/KartuSampling/:id"
          element={
            <AuthLoader>
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="create_ks"
                userPermissions={userPermissions}
              >
                <KartuSampling />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/ListSamplingCard"
          element={
            <AuthLoader>
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="list_sampling_card"
                userPermissions={userPermissions}
              >
                <ListSamplingCard />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/EditSamplingCard"
          element={
            <AuthLoader>
                  <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="create_ks"
                userPermissions={userPermissions}
              >
                <EditSamplingCard />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/RamanDashboard"
          element={
            <AuthLoader>
                  <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="identification_raman"
                userPermissions={userPermissions}
              >
                <RamanDashboard />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/DashboardRamanView"
          element={
            <AuthLoader>
                  <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="dashboard_raman"
                userPermissions={userPermissions}
              >
                <RamanMonitoringDashboard />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/EditHomePages"
          element={
            <AuthLoader>
                  <ProtectedRoute
                isLoggedIn={isLoggedIn}
            //     permission="settings_home_pages"
            //     userPermissions={userPermissions}
              >
                <EditHomePages />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/masterListMediaDanKuman"
          element={
            <AuthLoader>
              <MediaBacteriaManagement />{" "}
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
                  <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="create_ks"
                userPermissions={userPermissions}
              >
                <ApprovalsSamplingCard />
              </ProtectedRoute>
            </AuthLoader>
          }
        />
        <Route
          path="/ApprovalsMicrobiologyReport"
          element={
            <AuthLoader>
              <ApprovalsMicrobiologyReport />{" "}
            </AuthLoader>
          }
        />
        <Route path="/GalleryPDFFormat/:id" element={<GalleryPDFFormat />} />
        <Route
          path="/KelolaUser"
          element={
            <AuthLoader>
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                permission="user_management"
                userPermissions={userPermissions}
              >
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
