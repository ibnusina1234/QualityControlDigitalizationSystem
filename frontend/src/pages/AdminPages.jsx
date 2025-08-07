import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { UserCog, FileText, Settings, House,UserRoundPlus } from "lucide-react";
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
    title: "Edit Role Akses",
    description: "Ubah user akses berdasarkan Role.",
    icon: <Settings className="h-8 w-8 text-yellow-500" />,
    path: "/UserAccessSettings",
    roleRequired: ["admin", "super admin"],
    // Tidak ada roleRequired berarti semua admin/super admin bisa lihat
  },
  {
    title: "Registrasi User",
    description: "Registrasi user baru oleh Admin.",
    icon: <UserRoundPlus className="h-8 w-8 text-red-500" />,
    path: "/Register",
    // Tidak ada roleRequired berarti semua admin/super admin bisa lihat
  },
  {
    title: "Settings Home Pages",
    description: "Merubah pengaturan dan tampilan home page.",
    icon: <House className="h-8 w-8 text-red-500" />,
    path: "/EditHomePages",
    // Tidak ada roleRequired berarti semua admin/super admin bisa lihat
  },
];

export default function AdminPages() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user); // Ambil user dari Redux
  const userRole = user?.userrole; // Ambil role dari user

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
          if (menu.roleRequired && !menu.roleRequired.includes(userRole)) {
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