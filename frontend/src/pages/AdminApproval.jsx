import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
      Box,
      Button,
      FormControl,
      FormLabel,
      Input,
      Select,
      Spinner,
      useToast,
      Text,
} from "@chakra-ui/react";
import axios from "axios";

const AdminApproval = () => {
      const userRedux = useSelector((state) => state.user.user);
      const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
      const isAdmin = isLoggedIn && userRedux?.userrole === "admin";
      const isSuperAdmin = isLoggedIn && userRedux?.userrole === "super admin";
      const { userId } = useParams();
      const [user, setUser] = useState(null);
      const [userRole, setUserRole] = useState("");
      const [isPageLoading, setIsPageLoading] = useState(true);
      const [isActionLoading, setIsActionLoading] = useState(false);
      const toast = useToast();
      const navigate = useNavigate();

      useEffect(() => {
            const fetchUser = async () => {
                  try {
                        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/detail/${userId}`);
                        if (response.data) {
                              setUser(response.data);
                              setUserRole(response.data.userrole || "");
                        } else {
                              setUser(null);
                        }
                  } catch (error) {
                        console.error("Error fetching user:", error);
                        toast({
                              title: "Gagal mengambil data user.",
                              description: error.message,
                              status: "error",
                              duration: 3000,
                              isClosable: true,
                              position: "top",
                        });
                        setUser(null);
                  } finally {
                        setIsPageLoading(false);
                  }
            };

            if (userId) {
                  fetchUser();
            }
      }, [userId, toast]);

      const handleApproval = useCallback(async (status) => {
            setIsActionLoading(true);

            try {
                  const requestData = {
                        userId: user.id,
                        status,
                        userRole,
                        updated_at: new Date().toISOString(),
                        updated_by: userRedux?.email,
                  };

                  const response = await axios.patch(
                        (`${process.env.REACT_APP_API_BASE_URL}/users/UpdateUserStatus/${user.id}`),
                        requestData,
                        {
                              headers: { "Content-Type": "application/json" },
                              withCredentials: true // Pastikan token dikirim dengan benar
                        }
                  );

                  // Cek respons dan tampilkan data
                  console.log("Server response:", response.data);

                  // Tampilkan pesan jika berhasil
                  if (response.data && response.data.message) {
                        toast({
                              title: response.data.message,
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                              position: "top",
                        });
                  }

                  // Update user setelah status diperbarui
                  const updatedUserResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/detail/${user.id}`);
                  setUser(updatedUserResponse.data);

                  // Navigasi ke halaman admin approval setelah status berhasil diperbarui
                  setTimeout(() => {
                        navigate("/Home");
                  }, 1500);

            } catch (error) {
                  console.error("Error occurred:", error);
                  toast({
                        title: "Gagal memperbarui status user.",
                        description: error.response?.data?.message || "Terjadi kesalahan saat menyimpan.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                        position: "top",
                  });
            } finally {
                  setIsActionLoading(false);
            }
      }, [user, userRole, userRedux?.email, navigate, toast]);


      if (isPageLoading) {
            return (
                  <Box p={8} mt={20} display="flex" justifyContent="center">
                        <Spinner size="xl" />
                  </Box>
            );
      }

      if (!user) {
            return (
                  <Box p={8} mt={20}>
                        <Text>User tidak ditemukan.</Text>
                        <Button mt={4} onClick={() => navigate("/AdminApproval")}>
                              Kembali
                        </Button>
                  </Box>
            );
      }

      return (
            <>
                  {isAdmin ? (
                        <Box p={8} mt={20}>
                              <FormControl mb={4}>
                                    <FormLabel>ID</FormLabel>
                                    <Input type="text" value={user.id || ""} isReadOnly />
                              </FormControl>
                              <FormControl mb={4}>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" value={user.email || ""} isReadOnly />
                              </FormControl>
                              <FormControl mb={4} isRequired>
                                    <FormLabel>User Role</FormLabel>
                                    <Select
                                          value={userRole}
                                          onChange={(e) => setUserRole(e.target.value)}
                                          placeholder="Pilih role"
                                    >
                                          {isSuperAdmin && <option value="super_admin">super admin</option>}
                                          <option value="admin">Admin</option>
                                          <option value="user">User</option>
                                    </Select>
                              </FormControl>
                              <Button
                                    colorScheme="green"
                                    mr={3}
                                    onClick={() => handleApproval("Accept")}
                                    isDisabled={!userRole || isActionLoading}
                                    isLoading={isActionLoading}
                              >
                                    Accept
                              </Button>
                              <Button
                                    colorScheme="red"
                                    onClick={() => handleApproval("Reject")}
                                    isDisabled={!userRole || isActionLoading}
                                    isLoading={isActionLoading}
                              >
                                    Reject
                              </Button>
                        </Box>
                  ) : (
                        <Box p={8} mt={20}>
                              <Text color="red.500">
                                    Akses ditolak. Hanya admin yang dapat mengakses halaman ini.
                              </Text>
                        </Box>
                  )}
            </>
      );
};

export default AdminApproval;
