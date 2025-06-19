import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { UserCog, FileText, Settings, Bell } from "lucide-react";
import { useColorModeValue } from "@chakra-ui/react";

const adminMenus = [
  {
    title: "User Management",
    description: "Delete and Edit Role User.",
    icon: <UserCog className="h-8 w-8 text-blue-500" />,
    path: "/KelolaUser",
    roleRequired: ["admin", "super admin"]
  },
  {
    title: "Audit Trail",
    description: "Lihat Log Activity.",
    icon: <FileText className="h-8 w-8 text-green-500" />,
    path: "/LogActivity",
    roleRequired: ["admin", "super admin"]
  },
  {
    title: "Pengaturan",
    description: "Ubah konfigurasi sistem.",
    icon: <Settings className="h-8 w-8 text-yellow-500" />,
    path: "/EditHome",
     roleRequired: ["admin", "super admin"],
     jabatanRequired : ["ADMIN QC"]
  },
  {
    title: "Notifikasi",
    description: "Kelola notifikasi dan email masuk.",
    icon: <Bell className="h-8 w-8 text-red-500" />,
    path: "/admin/notifications",
    // Tidak ada roleRequired berarti semua admin/super admin bisa lihat
  },
    {
    title: "Edit Profil",
    description: "Ubah data diri.",
    icon: <Settings className="h-8 w-8 text-yellow-500" />,
    path: "/EditHome",
  },
];

export default function AdminPages() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user); // Ambil user dari Redux
  const userRole = user?.userrole; 
  const userJabatan =user?.jabatan;

  // Chakra color mode values
  const bgCard = useColorModeValue("bg-white", "bg-gray-800");
  const shadowCard = useColorModeValue("shadow-md", "shadow-2xl");
  const hoverShadow = useColorModeValue("hover:shadow-xl", "hover:shadow-blue-900");
  const textTitle = useColorModeValue("text-2xl text-gray-900", "text-2xl text-white");
  const textMenuTitle = useColorModeValue("text-lg text-gray-900", "text-lg text-white");
  const textMenuDesc = useColorModeValue("text-sm text-gray-500", "text-sm text-gray-300");

  return (
    <div className="p-6 m-20">
      <h1 className={`font-bold mb-6 ${textTitle}`}>Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminMenus.map((menu, index) => {
          // Jika menu punya roleRequired dan userRole tidak ada di array tsb, maka hide menu
          if ((menu.roleRequired && !menu.roleRequired.includes(userRole)) || (menu.jabatanRequired && !menu.jabatanRequired.includes(userJabatan))) {
            return null;
          }

          return (
            <div
              key={index}
              onClick={() => navigate(menu.path)}
              className={`cursor-pointer rounded-xl p-6 transition-shadow duration-300 ${bgCard} ${shadowCard} ${hoverShadow}`}
            >
              <div className="flex items-center gap-4">
                <div>{menu.icon}</div>
                <div>
                  <h2 className={`font-semibold ${textMenuTitle}`}>{menu.title}</h2>
                  <p className={textMenuDesc}>{menu.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}