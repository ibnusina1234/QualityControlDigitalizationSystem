import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
      Box,
      Table,
      Thead,
      Tbody,
      Tr,
      Th,
      Td,
      Button,
      Heading,
      Input,
      Select,
      Flex,
      Modal,
      ModalOverlay,
      ModalContent,
      ModalHeader,
      ModalCloseButton,
      ModalBody,
      ModalFooter,
      useDisclosure,
      useColorModeValue,
      Text,
      HStack,
      Checkbox,
      useToast,
      AlertDialog,
      AlertDialogOverlay,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogBody,
      AlertDialogFooter,
      Spinner,
      Badge,
      Tooltip,
      NumberInput,
      NumberInputField,
      NumberInputStepper,
      NumberIncrementStepper,
      NumberDecrementStepper,
      FormControl,
      FormLabel,
      Textarea,
      VStack,
      Icon,
      ButtonGroup,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { FaBan, FaUnlock, FaClock, FaUserShield, FaEdit, FaTrash } from "react-icons/fa";
import AdminAccessModal from "./EditUserAkses"; // Import modal yang sudah ada

export default function KelolaUser() {
      const [users, setUsers] = useState([]);
      const [blockedStatus, setBlockedStatus] = useState({});
      const userRedux = useSelector((state) => state.user.user);
      const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
      const isAdmin = isLoggedIn && userRedux?.userrole === "admin";
      const isSuperAdmin = isLoggedIn && userRedux?.userrole === "super admin";
      const [editingUser, setEditingUser] = useState(null);
      const [searchTerm, setSearchTerm] = useState("");
      const [roleFilter, setRoleFilter] = useState("");
      const [currentPage, setCurrentPage] = useState(1);
      const [selectedUsers, setSelectedUsers] = useState([]);
      const [userToDelete, setUserToDelete] = useState(null);

      // --- State untuk AdminAccessModal ---
      const [roleEditingUser, setRoleEditingUser] = useState(null);
      const [currentUserRole, setCurrentUserRole] = useState("");
      const [isRoleLoading, setIsRoleLoading] = useState(false);

      // --- State untuk loading tombol block/unblock ---
      const [blockingUsers, setBlockingUsers] = useState(new Set());

      // --- State untuk modal block ---
      const [blockModalUser, setBlockModalUser] = useState(null);
      const [blockDuration, setBlockDuration] = useState(30);
      const [blockReason, setBlockReason] = useState('');

      const usersPerPage = 5;
      const toast = useToast();
      const cancelRef = useRef();

      // Modal untuk edit user
      const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

      // Modal untuk delete multiple users
      const { isOpen: isMultiDeleteOpen, onOpen: onMultiDeleteOpen, onClose: onMultiDeleteClose } = useDisclosure();

      // Alert dialog untuk delete single user
      const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();

      // Modal untuk block user
      const { isOpen: isBlockModalOpen, onOpen: onBlockModalOpen, onClose: onBlockModalClose } = useDisclosure();

      const bgTable = useColorModeValue("white", "gray.700");
      const modalBg = useColorModeValue("white", "gray.800");
      const borderColor = useColorModeValue("gray.200", "gray.600");

      useEffect(() => {
            if (isLoggedIn && (isAdmin || isSuperAdmin)) {
                  fetchUsers();
                  fetchBlockedStatus();

                  // Auto refresh lebih sering untuk sinkronisasi
                  const interval = setInterval(() => {
                        if (isLoggedIn && (isAdmin || isSuperAdmin)) {
                              fetchBlockedStatus();
                        }
                  }, 15000); // Refresh setiap 15 detik

                  return () => clearInterval(interval);
            }
      }, [isLoggedIn, isAdmin, isSuperAdmin]);
      const fetchUsers = async () => {
            try {
                  const res = await axios.get(
                        `${process.env.REACT_APP_API_BASE_URL}/users/getUsers`,
                        {
                              withCredentials: true
                        }
                  );
                  setUsers(res.data);
            } catch (err) {
                  console.error("Gagal fetch users:", err);
                  if (err.response?.status === 401) {
                        toast({
                              title: "Session expired",
                              description: "Silakan login kembali",
                              status: "warning",
                              duration: 3000,
                              isClosable: true,
                        });
                  }
            }
      };

      // --- Fungsi untuk fetch status blocked dari backend ---
      const fetchBlockedStatus = async () => {
            if (!isLoggedIn || (!isAdmin && !isSuperAdmin)) {
                  console.log("User tidak memiliki akses admin, skip fetch blocked status");
                  return;
            }

            try {
                  const res = await axios.get(
                        `${process.env.REACT_APP_API_BASE_URL}/admin/blocked-status`,
                        {
                              withCredentials: true
                        }
                  );

                  if (res.data.success) {
                        // FIXED: Ambil data yang lebih comprehensive
                        const blockedData = res.data.data.blocked || {};
                        const userBlocks = res.data.data.userBlocks || {};

                        console.log('📊 Blocked Status Update:', {
                              total: Object.keys(blockedData).length,
                              userBlocks: Object.keys(userBlocks).length,
                              keys: Object.keys(blockedData)
                        });

                        setBlockedStatus(blockedData);
                  }
            } catch (err) {
                  console.error("Gagal fetch blocked status:", err);

                  if (err.response?.status === 401) {
                        console.log("Unauthorized access - session expired");
                        setBlockedStatus({});

                        toast({
                              title: "Session expired",
                              description: "Silakan login kembali",
                              status: "warning",
                              duration: 3000,
                              isClosable: true,
                        });
                  } else {
                        setBlockedStatus({});
                  }
            }
      };

      // --- Fungsi untuk buka modal block ---
      const handleOpenBlockModal = (user) => {
            setBlockModalUser(user);
            setBlockDuration(30);
            setBlockReason('Pelanggaran kebijakan sistem');
            onBlockModalOpen();
      };

      // --- Fungsi untuk block user ---
      const handleBlockUser = async () => {
            if (!blockModalUser) return;

            const userId = blockModalUser.id;
            setBlockingUsers(prev => new Set([...prev, userId]));

            try {
                  const durationMs = blockDuration * 60 * 1000;

                  const response = await axios.post(
                        `${process.env.REACT_APP_API_BASE_URL}/admin/block-user`,
                        {
                              userId: userId,
                              userEmail: blockModalUser.email,
                              duration: durationMs,
                              reason: blockReason
                        },
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.success) {
                        toast({
                              title: `User ${blockModalUser.nama_lengkap} berhasil diblokir.`,
                              description: `Diblokir sampai ${new Date(response.data.data.blockedUntil).toLocaleString()}`,
                              status: "success",
                              duration: 4000,
                              isClosable: true,
                        });

                        // IMMEDIATE UI UPDATE: Add to blocked status immediately
                        const userKey = `user_${userId}`;
                        setBlockedStatus(prev => ({
                              ...prev,
                              [userKey]: {
                                    count: 999,
                                    resetTime: Date.now() + durationMs,
                                    type: blockReason || 'manual_block',
                                    blockedAt: Date.now(),
                                    userId: userId,
                                    manual: true,
                                    timeLeft: durationMs
                              }
                        }));

                        onBlockModalClose();
                  }

            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal memblokir user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            } finally {
                  setBlockingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userId);
                        return newSet;
                  });
            }
      };


      // --- Fungsi untuk unblock user ---
      const handleUnblockUser = async (user) => {
            const userId = user.id;
            setBlockingUsers(prev => new Set([...prev, userId]));

            try {
                  const response = await axios.post(
                        `${process.env.REACT_APP_API_BASE_URL}/admin/unblock-user`,
                        {
                              userId: userId,
                              addToWhitelistTemp: false
                        },
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.success) {
                        toast({
                              title: `User ${user.nama_lengkap} berhasil di-unblok.`,
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                        });

                        // IMMEDIATE UI UPDATE: Remove from blocked status
                        setBlockedStatus(prev => {
                              const newStatus = { ...prev };
                              const userKey = `user_${userId}`;
                              delete newStatus[userKey];

                              // Also remove any alternative keys
                              Object.keys(newStatus).forEach(key => {
                                    if (newStatus[key].userId && newStatus[key].userId.toString() === userId.toString()) {
                                          delete newStatus[key];
                                    }
                              });

                              return newStatus;
                        });
                  }

            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal meng-unblok user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            } finally {
                  setBlockingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userId);
                        return newSet;
                  });
            }
      };



      // --- Fungsi untuk cek apakah user sedang diblok ---
      const isUserBlocked = (userId) => {
            const userKey = `user_${userId}`;
            const blockData = blockedStatus[userKey];

            if (!blockData) {
                  // TAMBAHAN: Cek juga kemungkinan ada block dengan key lain
                  const alternativeKeys = Object.keys(blockedStatus).filter(key =>
                        blockedStatus[key].userId && blockedStatus[key].userId.toString() === userId.toString()
                  );

                  if (alternativeKeys.length > 0) {
                        console.log(`Found alternative block key for user ${userId}:`, alternativeKeys);
                        return true;
                  }

                  return false;
            }

            const now = Date.now();
            if (now > blockData.resetTime) {
                  console.log(`Block expired for user ${userId}`);
                  return false;
            }

            return true;
      };

      // --- Fungsi untuk mendapatkan info block ---
      const getBlockInfo = (userId) => {
            const userKey = `user_${userId}`;
            let blockData = blockedStatus[userKey];

            // Jika tidak ada, cari alternative key
            if (!blockData) {
                  const alternativeKey = Object.keys(blockedStatus).find(key =>
                        blockedStatus[key].userId && blockedStatus[key].userId.toString() === userId.toString()
                  );

                  if (alternativeKey) {
                        blockData = blockedStatus[alternativeKey];
                        console.log(`Using alternative key ${alternativeKey} for user ${userId}`);
                  }
            }

            if (!blockData) return null;

            const resetTime = new Date(blockData.resetTime);
            const now = new Date();
            const timeLeft = resetTime - now;

            return {
                  ...blockData,
                  timeLeft: timeLeft > 0 ? timeLeft : 0,
                  resetTime: resetTime,
                  timeLeftFormatted: formatTimeLeft(timeLeft)
            };
      };

      // Helper function untuk format time left
      const formatTimeLeft = (milliseconds) => {
            if (milliseconds <= 0) return 'Expired';

            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}h ${hours % 24}j`;
            if (hours > 0) return `${hours}j ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
            return `${seconds}s`;
      };

      // --- Fungsi untuk unblock all ---
      const handleUnblockAll = async () => {
            try {
                  const response = await axios.post(
                        `${process.env.REACT_APP_API_BASE_URL}/admin/unblock-all`,
                        {},
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.success) {
                        toast({
                              title: "Semua user berhasil di-unblok.",
                              description: `${response.data.data.clearedCount} user di-unblok`,
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                        });

                        await fetchBlockedStatus();
                  }

            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal meng-unblok semua user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            }
      };

      // --- Fungsi fetch user role untuk modal ---
      const fetchUserRole = async (userId) => {
            console.log("Fetching role for user:", userId);

            try {
                  setIsRoleLoading(true);
                  const response = await axios.get(
                        `${process.env.REACT_APP_API_BASE_URL}/users/userrole/${userId}`,
                        {
                              withCredentials: true
                        }
                  );

                  console.log("Profile response:", response.data);

                  // PERBAIKI DI SINI:
                  if (response.data.userrole) {
                        const userRole = response.data.userrole;
                        setCurrentUserRole(userRole);
                        return userRole;
                  } else {
                        throw new Error(response.data.error || "Failed to fetch user role");
                  }
            } catch (err) {
                  console.error("Gagal fetch user role:", err);
                  toast({
                        title: "Gagal mengambil data role user.",
                        description: err.response?.data?.error || err.message || "Terjadi kesalahan",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
                  setCurrentUserRole("");
                  return null;
            } finally {
                  setIsRoleLoading(false);
            }
      };

      // --- Fungsi untuk buka AdminAccessModal ---
      const handleOpenRoleModal = async (user) => {
            console.log("Opening role modal for user:", user);

            try {
                  setIsRoleLoading(true);
                  setRoleEditingUser(user);
                  const userRole = await fetchUserRole(user.id);
                  setIsRoleLoading(false);

                  if (userRole) {
                        // Modal AdminAccessModal akan terbuka karena roleEditingUser sudah di-set
                  }

            } catch (error) {
                  console.error("Error opening role modal:", error);
                  toast({
                        title: "Gagal membuka modal role.",
                        description: "Terjadi kesalahan saat memuat data",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            }
      };

      // --- Fungsi untuk save role user (dipanggil dari AdminAccessModal) ---
      const handleSaveRole = async (newUserRole) => {
            if (!roleEditingUser || !newUserRole) return;

            try {
                  setIsRoleLoading(true);

                  const response = await axios.put(
                        `${process.env.REACT_APP_API_BASE_URL}/users/userrole/${roleEditingUser.id}`,
                        { userrole: newUserRole },
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.message) { // atau bisa juga cek status response
                        toast({
                              title: "Role user berhasil diupdate.",
                              description: `Role ${roleEditingUser.nama_lengkap} berhasil diubah menjadi ${newUserRole}`,
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                        });

                        await fetchUsers();
                        handleCloseRoleModal();

                  }
            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal mengupdate role user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            } finally {
                  setIsRoleLoading(false);
            }
      };

      // --- Fungsi untuk close AdminAccessModal ---
      const handleCloseRoleModal = () => {
            setRoleEditingUser(null);
            setCurrentUserRole("");
            setIsRoleLoading(false);
      };

      // --- Fungsi untuk edit user ---
      const handleEditUser = (user) => {
            setEditingUser(user);
            onEditModalOpen();
      };

      // --- Fungsi untuk save edit user ---
      const handleSaveEdit = async () => {
            try {
                  const response = await axios.put(
                        `${process.env.REACT_APP_API_BASE_URL}/users/updateUser/${editingUser.id}`,
                        editingUser,
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.success) {
                        toast({
                              title: "User berhasil diupdate.",
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                        });

                        fetchUsers();
                        onEditModalClose();
                        setEditingUser(null);
                  }
            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal mengupdate user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            }
      };

      // --- Fungsi untuk delete user ---
      const handleDeleteUser = async () => {
            if (!userToDelete) return;

            try {
                  const response = await axios.delete(
                        `${process.env.REACT_APP_API_BASE_URL}/users/deleteUser/${userToDelete.id}`,
                        {
                              withCredentials: true
                        }
                  );

                  if (response.data.success) {
                        toast({
                              title: `User ${userToDelete.nama_lengkap} berhasil dihapus.`,
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                        });

                        fetchUsers();
                        onDeleteAlertClose();
                        setUserToDelete(null);
                  }
            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal menghapus user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            }
      };

      // --- Fungsi untuk open delete confirm ---
      const handleOpenDeleteConfirm = (user) => {
            setUserToDelete(user);
            onDeleteAlertOpen();
      };

      // --- Fungsi untuk multi delete ---
      const handleMultiDelete = async () => {
            if (selectedUsers.length === 0) return;

            try {
                  const deletePromises = selectedUsers.map(userId =>
                        axios.delete(
                              `${process.env.REACT_APP_API_BASE_URL}/users/deleteUser/${userId}`,
                              {
                                    withCredentials: true
                              }
                        )
                  );

                  await Promise.all(deletePromises);

                  toast({
                        title: `${selectedUsers.length} user berhasil dihapus.`,
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                  });

                  fetchUsers();
                  setSelectedUsers([]);
                  onMultiDeleteClose();
            } catch (err) {
                  const errorMsg = err.response?.data?.error || "Terjadi kesalahan";
                  toast({
                        title: "Gagal menghapus user.",
                        description: errorMsg,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                  });
            }
      };

      // --- Fungsi untuk select/deselect user ---
      const handleSelectUser = (userId) => {
            setSelectedUsers(prev => {
                  if (prev.includes(userId)) {
                        return prev.filter(id => id !== userId);
                  } else {
                        return [...prev, userId];
                  }
            });
      };

      // --- Fungsi untuk select all users ---
      const handleSelectAll = () => {
            if (selectedUsers.length === paginatedUsers.length) {
                  setSelectedUsers([]);
            } else {
                  setSelectedUsers(paginatedUsers.map(user => user.id));
            }
      };

      // Filter dan pagination logic
      const filteredUsers = users.filter((user) => {
            const matchesSearch = user.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === "" || user.userrole === roleFilter;
            return matchesSearch && matchesRole;
      });

      const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
      const startIndex = (currentPage - 1) * usersPerPage;
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

      // Render blocked status badge
      const renderBlockedStatus = (userId) => {
            const blocked = isUserBlocked(userId);

            if (blocked) {
                  const blockInfo = getBlockInfo(userId);
                  const tooltipText = blockInfo ?
                        `Diblokir sampai: ${blockInfo.resetTime.toLocaleString()}\n` +
                        `Sisa waktu: ${blockInfo.timeLeftFormatted}\n` +
                        `Alasan: ${blockInfo.type || 'N/A'}\n` +
                        `Manual: ${blockInfo.manual ? 'Ya' : 'Tidak'}`
                        : 'Block info not available';

                  return (
                        <Tooltip label={tooltipText}>
                              <Badge colorScheme="red" variant="solid" fontSize="xs">
                                    <Icon as={FaBan} mr={1} />
                                    BLOCKED
                              </Badge>
                        </Tooltip>
                  );
            }

            return (
                  <Badge colorScheme="green" variant="outline" fontSize="xs">
                        AKTIF
                  </Badge>
            );
      };

      // ENHANCED: Blocked Status Summary dengan lebih detail
      const renderBlockedSummary = () => {
            const blockedKeys = Object.keys(blockedStatus);
            if (blockedKeys.length === 0) return null;

            const userBlocks = blockedKeys.filter(key => key.startsWith('user_'));
            const ipBlocks = blockedKeys.filter(key => key.startsWith('ip_'));
            const loginBlocks = blockedKeys.filter(key => key.startsWith('login_'));

            return (
                  <Box mb={4} p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                        <Text fontWeight="bold" color="red.600" mb={2}>
                              📊 Blocked Status Summary: {blockedKeys.length} total blocks
                        </Text>
                        <HStack spacing={4} mb={2}>
                              <Badge colorScheme="red">{userBlocks.length} User Blocks</Badge>
                              <Badge colorScheme="orange">{ipBlocks.length} IP Blocks</Badge>
                              <Badge colorScheme="yellow">{loginBlocks.length} Login Blocks</Badge>
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                              {userBlocks.slice(0, 5).map(key => {
                                    const data = blockedStatus[key];
                                    const userId = key.replace('user_', '');
                                    const user = users.find(u => u.id.toString() === userId);
                                    const timeLeft = formatTimeLeft(data.resetTime - Date.now());

                                    return (
                                          <Badge key={key} colorScheme="red" fontSize="xs">
                                                {user?.nama_lengkap || `User ${userId}`} ({timeLeft})
                                          </Badge>
                                    );
                              })}
                              {userBlocks.length > 5 && (
                                    <Badge colorScheme="gray" fontSize="xs">
                                          +{userBlocks.length - 5} more users
                                    </Badge>
                              )}
                        </HStack>

                        {/* Show IP blocks if any */}
                        {ipBlocks.length > 0 && (
                              <HStack spacing={2} flexWrap="wrap" mt={2}>
                                    <Text fontSize="sm" color="gray.600">IP Blocks:</Text>
                                    {ipBlocks.slice(0, 3).map(key => {
                                          const data = blockedStatus[key];
                                          const ip = key.replace('ip_', '');
                                          const timeLeft = formatTimeLeft(data.resetTime - Date.now());

                                          return (
                                                <Badge key={key} colorScheme="orange" fontSize="xs">
                                                      {ip} ({timeLeft})
                                                </Badge>
                                          );
                                    })}
                                    {ipBlocks.length > 3 && (
                                          <Badge colorScheme="gray" fontSize="xs">
                                                +{ipBlocks.length - 3} more IPs
                                          </Badge>
                                    )}
                              </HStack>
                        )}
                  </Box>
            );
      };


      // Check if user has admin access
      if (!isLoggedIn || (!isAdmin && !isSuperAdmin)) {
            return (
                  <Box p={6} textAlign="center">
                        <Heading size="md" color="red.500">
                              Akses Ditolak
                        </Heading>
                        <Text mt={2}>
                              Anda tidak memiliki akses untuk mengelola user.
                        </Text>
                  </Box>
            );
      }


      return (
            <Box p={6}>
                  <Heading mb={6} size="lg">
                        Kelola User
                  </Heading>

                  {/* Controls */}
                  <Flex mb={4} gap={4} flexWrap="wrap" align="center">
                        <Input
                              placeholder="Cari nama atau email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              maxW="300px"
                        />
                        <Select
                              placeholder="Filter role"
                              value={roleFilter}
                              onChange={(e) => setRoleFilter(e.target.value)}
                              maxW="200px"
                        >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="super admin">Super Admin</option>
                        </Select>

                        <ButtonGroup size="sm">
                              <Button
                                    colorScheme="orange"
                                    onClick={handleUnblockAll}
                                    leftIcon={<FaUnlock />}
                                    variant="outline"
                              >
                                    Unblock All
                              </Button>
                              <Button
                                    colorScheme="blue"
                                    onClick={fetchBlockedStatus}
                                    leftIcon={<FaClock />}
                                    variant="outline"
                              >
                                    Refresh Status
                              </Button>
                              {selectedUsers.length > 0 && (
                                    <Button
                                          colorScheme="red"
                                          onClick={onMultiDeleteOpen}
                                          leftIcon={<FaTrash />}
                                          variant="outline"
                                    >
                                          Delete Selected ({selectedUsers.length})
                                    </Button>
                              )}
                        </ButtonGroup>
                  </Flex>

                  {/* Blocked Status Summary */}
                  {Object.keys(blockedStatus).length > 0 && (
                        <Box mb={4} p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                              <Text fontWeight="bold" color="red.600" mb={2}>
                                    📊 Summary Blocked Users: {Object.keys(blockedStatus).length} user(s) blocked
                              </Text>
                              <HStack spacing={2} flexWrap="wrap">
                                    {Object.entries(blockedStatus).slice(0, 5).map(([key, data]) => {
                                          const userId = key.replace('user_', '');
                                          const user = users.find(u => u.id.toString() === userId);
                                          const timeLeft = formatTimeLeft(data.resetTime - Date.now());

                                          return (
                                                <Badge key={key} colorScheme="red" fontSize="xs">
                                                      {user?.nama_lengkap || `User ${userId}`} ({timeLeft})
                                                </Badge>
                                          );
                                    })}
                                    {Object.keys(blockedStatus).length > 5 && (
                                          <Badge colorScheme="gray" fontSize="xs">
                                                +{Object.keys(blockedStatus).length - 5} more
                                          </Badge>
                                    )}
                              </HStack>
                        </Box>
                  )}

                  {/* Table */}
                  <Box bg={bgTable} borderRadius="md" border="1px" borderColor={borderColor}>
                        <Table variant="simple">
                              <Thead>
                                    <Tr>
                                          <Th>
                                                <Checkbox
                                                      isChecked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                                      isIndeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                                                      onChange={handleSelectAll}
                                                />
                                          </Th>
                                          <Th>Nama</Th>
                                          <Th>Email</Th>
                                          <Th>Role</Th>
                                          <Th>Status</Th>
                                          <Th>Aksi</Th>
                                    </Tr>
                              </Thead>
                              <Tbody>
                                    {paginatedUsers.map((user) => (
                                          <Tr key={user.id}>
                                                <Td>
                                                      <Checkbox
                                                            isChecked={selectedUsers.includes(user.id)}
                                                            onChange={() => handleSelectUser(user.id)}
                                                      />
                                                </Td>
                                                <Td>{user.nama_lengkap}</Td>
                                                <Td>{user.email}</Td>
                                                <Td>
                                                      <Badge
                                                            colorScheme={user.userrole === 'super admin' ? 'purple' :
                                                                  user.userrole === 'admin' ? 'blue' : 'green'}
                                                      >
                                                            {user.userrole}
                                                      </Badge>
                                                </Td>
                                                <Td>{renderBlockedStatus(user.id)}</Td>
                                                <Td>
                                                      <ButtonGroup size="sm" spacing={2}>
                                                            {/* Block/Unblock Button */}
                                                            {isUserBlocked(user.id) ? (
                                                                  <Button
                                                                        colorScheme="green"
                                                                        size="sm"
                                                                        leftIcon={<FaUnlock />}
                                                                        onClick={() => handleUnblockUser(user)}
                                                                        isLoading={blockingUsers.has(user.id)}
                                                                        loadingText="Unblocking..."
                                                                  >
                                                                        Unblock
                                                                  </Button>
                                                            ) : (
                                                                  <Button
                                                                        colorScheme="red"
                                                                        size="sm"
                                                                        leftIcon={<FaBan />}
                                                                        onClick={() => handleOpenBlockModal(user)}
                                                                        isLoading={blockingUsers.has(user.id)}
                                                                        loadingText="Blocking..."
                                                                        isDisabled={user.userrole === 'super admin'}
                                                                  >
                                                                        Block
                                                                  </Button>
                                                            )}

                                                            {/* Edit Button */}
                                                            <Button
                                                                  colorScheme="blue"
                                                                  size="sm"
                                                                  leftIcon={<FaEdit />}
                                                                  onClick={() => handleEditUser(user)}
                                                            >
                                                                  Edit
                                                            </Button>

                                                            {/* Role Button */}
                                                            <Button
                                                                  colorScheme="purple"
                                                                  size="sm"
                                                                  leftIcon={<FaUserShield />}
                                                                  onClick={() => handleOpenRoleModal(user)}
                                                                  isLoading={isRoleLoading && roleEditingUser?.id === user.id}
                                                                  loadingText="Loading..."
                                                            >
                                                                  Role
                                                            </Button>

                                                            {/* Delete Button */}
                                                            <Button
                                                                  colorScheme="red"
                                                                  size="sm"
                                                                  leftIcon={<FaTrash />}
                                                                  onClick={() => handleOpenDeleteConfirm(user)}
                                                                  variant="outline"
                                                                  isDisabled={user.userrole === 'super admin'}
                                                            >
                                                                  Delete
                                                            </Button>
                                                      </ButtonGroup>
                                                </Td>
                                          </Tr>
                                    ))}
                              </Tbody>
                        </Table>
                  </Box>

                  {/* Pagination */}
                  <Flex justify="center" mt={4}>
                        <ButtonGroup>
                              <Button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    isDisabled={currentPage === 1}
                              >
                                    Previous
                              </Button>

                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                          key={page}
                                          onClick={() => setCurrentPage(page)}
                                          colorScheme={currentPage === page ? "blue" : "gray"}
                                          variant={currentPage === page ? "solid" : "outline"}
                                    >
                                          {page}
                                    </Button>
                              ))}

                              <Button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    isDisabled={currentPage === totalPages}
                              >
                                    Next
                              </Button>
                        </ButtonGroup>
                  </Flex>

                  {renderBlockedSummary()}

                  {/* Edit User Modal */}
                  <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="md">
                        <ModalOverlay />
                        <ModalContent bg={modalBg}>
                              <ModalHeader>Edit User: {editingUser?.nama_lengkap}</ModalHeader>
                              <ModalCloseButton />
                              <ModalBody>
                                    <VStack spacing={4} align="stretch">
                                          <FormControl>
                                                <FormLabel>Nama Lengkap</FormLabel>
                                                <Input
                                                      value={editingUser?.nama_lengkap || ''}
                                                      onChange={(e) => setEditingUser(prev => ({
                                                            ...prev,
                                                            nama_lengkap: e.target.value
                                                      }))}
                                                />
                                          </FormControl>

                                          <FormControl>
                                                <FormLabel>Email</FormLabel>
                                                <Input
                                                      value={editingUser?.email || ''}
                                                      onChange={(e) => setEditingUser(prev => ({
                                                            ...prev,
                                                            email: e.target.value
                                                      }))}
                                                />
                                          </FormControl>
                                    </VStack>
                              </ModalBody>
                              <ModalFooter>
                                    <Button variant="ghost" mr={3} onClick={onEditModalClose}>
                                          Batal
                                    </Button>
                                    <Button colorScheme="blue" onClick={handleSaveEdit}>
                                          Simpan
                                    </Button>
                              </ModalFooter>
                        </ModalContent>
                  </Modal>

                  {/* AdminAccessModal untuk mengubah role */}
                  <AdminAccessModal
                        show={roleEditingUser !== null}
                        onClose={handleCloseRoleModal}
                        initialAccess={currentUserRole}
                        onSave={handleSaveRole}
                        userName={roleEditingUser?.nama_lengkap || ""}
                  />

                  {/* Block User Modal */}
                  <Modal isOpen={isBlockModalOpen} onClose={onBlockModalClose} size="md">
                        <ModalOverlay />
                        <ModalContent bg={modalBg}>
                              <ModalHeader>
                                    <HStack>
                                          <Icon as={FaBan} color="red.500" />
                                          <Text>Block User: {blockModalUser?.nama_lengkap}</Text>
                                    </HStack>
                              </ModalHeader>
                              <ModalCloseButton />
                              <ModalBody>
                                    <VStack spacing={4} align="stretch">
                                          <FormControl>
                                                <FormLabel>Durasi Block (menit)</FormLabel>
                                                <NumberInput
                                                      value={blockDuration}
                                                      onChange={(_, val) => setBlockDuration(val)}
                                                      min={1}
                                                      max={43200}
                                                >
                                                      <NumberInputField />
                                                      <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                      </NumberInputStepper>
                                                </NumberInput>
                                                <Text fontSize="sm" color="gray.500" mt={1}>
                                                      Akan diblokir sampai: {new Date(Date.now() + blockDuration * 60 * 1000).toLocaleString()}
                                                </Text>
                                          </FormControl>

                                          <FormControl>
                                                <FormLabel>Alasan Block</FormLabel>
                                                <Textarea
                                                      value={blockReason}
                                                      onChange={(e) => setBlockReason(e.target.value)}
                                                      placeholder="Masukkan alasan block..."
                                                      rows={3}
                                                />
                                          </FormControl>

                                          <Box p={3} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                                                <Text fontSize="sm" color="red.600">
                                                      ⚠️ User akan diblokir dari mengakses sistem selama durasi yang ditentukan.
                                                </Text>
                                          </Box>
                                    </VStack>
                              </ModalBody>
                              <ModalFooter>
                                    <Button variant="ghost" mr={3} onClick={onBlockModalClose}>
                                          Batal
                                    </Button>
                                    <Button
                                          colorScheme="red"
                                          onClick={handleBlockUser}
                                          leftIcon={<FaBan />}
                                    >
                                          Block User
                                    </Button>
                              </ModalFooter>
                        </ModalContent>
                  </Modal>

                  {/* Single User Delete Confirmation Alert */}
                  <AlertDialog
                        isOpen={isDeleteAlertOpen}
                        leastDestructiveRef={cancelRef}
                        onClose={onDeleteAlertClose}
                  >
                        <AlertDialogOverlay>
                              <AlertDialogContent>
                                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                          Hapus User
                                    </AlertDialogHeader>
                                    <AlertDialogBody>
                                          Apakah Anda yakin ingin menghapus user <strong>{userToDelete?.nama_lengkap}</strong>?
                                          Aksi ini tidak dapat dibatalkan.
                                    </AlertDialogBody>
                                    <AlertDialogFooter>
                                          <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                                                Batal
                                          </Button>
                                          <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                                                Hapus
                                          </Button>
                                    </AlertDialogFooter>
                              </AlertDialogContent>
                        </AlertDialogOverlay>
                  </AlertDialog>

                  {/* Multi Delete Confirmation Alert */}
                  <AlertDialog
                        isOpen={isMultiDeleteOpen}
                        leastDestructiveRef={cancelRef}
                        onClose={onMultiDeleteClose}
                  >
                        <AlertDialogOverlay>
                              <AlertDialogContent>
                                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                          Hapus Multiple Users
                                    </AlertDialogHeader>
                                    <AlertDialogBody>
                                          Apakah Anda yakin ingin menghapus {selectedUsers.length} user yang dipilih?
                                          Aksi ini tidak dapat dibatalkan.
                                    </AlertDialogBody>
                                    <AlertDialogFooter>
                                          <Button ref={cancelRef} onClick={onMultiDeleteClose}>
                                                Batal
                                          </Button>
                                          <Button colorScheme="red" onClick={handleMultiDelete} ml={3}>
                                                Hapus Semua
                                          </Button>
                                    </AlertDialogFooter>
                              </AlertDialogContent>
                        </AlertDialogOverlay>
                  </AlertDialog>
            </Box>
      );
}