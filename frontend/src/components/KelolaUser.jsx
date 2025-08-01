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
} from "@chakra-ui/react";
import { useSelector } from "react-redux";

export default function KelolaUser() {
  const [users, setUsers] = useState([]);
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

  const usersPerPage = 5;
  const toast = useToast();
  const cancelRef = useRef();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isMultiDeleteOpen,
    onOpen: onMultiDeleteOpen,
    onClose: onMultiDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();

  const bgTable = useColorModeValue("white", "gray.700");
  const modalBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/users/getUsers`,
        { withCredentials: true }
      );
      setUsers(res.data);
    } catch (err) {
      console.error("Gagal fetch users:", err);
    }
  };

  // LOGIC AKSES
  function canEdit(user) {
    if (isSuperAdmin) return true;
    if (isAdmin && user.userrole !== "super admin") return true;
    return false;
  }
  function canDelete(user) {
    if (isSuperAdmin) return true;
    if (isAdmin && user.userrole !== "super admin") return true;
    return false;
  }

  // MODAL EDIT
  const handleEdit = (user) => {
    setEditingUser(user);
    onOpen();
  };

  // DELETE SINGLE
  const handleDelete = (id) => {
    setUserToDelete(id);
    onDeleteAlertOpen();
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/users/deleteUser/${userToDelete}`,
        { withCredentials: true }
      );
      toast({
        title: "User berhasil dihapus.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchUsers();
    } catch (err) {
      toast({
        title: "Gagal menghapus user.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUserToDelete(null);
      onDeleteAlertClose();
    }
  };

  // MULTI DELETE (Perbaikan: admin tidak bisa pilih super admin)
  const handleMultiDelete = async () => {
    let idsToDelete = selectedUsers;
    if (isAdmin) {
      // Admin tidak boleh hapus super admin
      idsToDelete = selectedUsers.filter(
        (id) => users.find((u) => u.id === id)?.userrole !== "super admin"
      );
    }
    // super admin bisa hapus semua
    if (idsToDelete.length === 0) {
      toast({
        title: "Tidak ada user yang bisa dihapus.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      onMultiDeleteClose();
      return;
    }
    try {
      await Promise.all(
        idsToDelete.map((id) =>
          axios.delete(
            `${process.env.REACT_APP_API_BASE_URL}/users/deleteUser/${id}`,
            { withCredentials: true }
          )
        )
      );
      toast({
        title: "User terpilih berhasil dihapus.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      toast({
        title: "Gagal menghapus beberapa user.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onMultiDeleteClose();
    }
  };

  // CEKBOX
  const handleCheckboxChange = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  // SELECT ALL (hanya user yang boleh dihapus yang bisa dipilih semua!)
  const handleSelectAll = () => {
    const selectableIds = paginatedUsers
      .filter((user) => canDelete(user))
      .map((user) => user.id);

    if (selectableIds.length === 0) return;

    if (
      selectableIds.every((id) => selectedUsers.includes(id)) &&
      selectedUsers.length === selectableIds.length
    ) {
      // Jika semua sudah ke-select, unselect semua
      setSelectedUsers(
        selectedUsers.filter((id) => !selectableIds.includes(id))
      );
    } else {
      // Select all yang bisa
      setSelectedUsers([
        ...selectedUsers.filter((id) => !selectableIds.includes(id)),
        ...selectableIds,
      ]);
    }
  };

  // EDIT
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingUser({ ...editingUser, [name]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/users/userrole/${editingUser.id}`,
        { userrole: editingUser.userrole },
        { withCredentials: true }
      );
      await fetchUsers();
      onClose();
      setEditingUser(null);
    } catch (err) {
      toast({
        title: "Gagal update user.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // FILTER & PAGINATION
  const filteredUsers = users
    .filter((user) =>
      `${user.nama_lengkap} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) => (roleFilter ? user.userrole === roleFilter : true));

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <Box p={6} mt={20}>
      <Heading mb={4}>User Management</Heading>

      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }}>
        <Input
          placeholder="Cari nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          placeholder="Filter Role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="super admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </Select>
        <Button
          fontSize={8}
          colorScheme="red"
          onClick={onMultiDeleteOpen}
          isDisabled={selectedUsers.length === 0}
        >
          Hapus Terpilih
        </Button>
      </Flex>

      <Box overflowX="auto" bg={bgTable} borderRadius="lg" boxShadow="md" p={4}>
        <Table variant="simple" size="md">
          <Thead bg={useColorModeValue("gray.100", "gray.600")}>
            <Tr>
              <Th>
                <Checkbox
                  isChecked={
                    paginatedUsers.length > 0 &&
                    paginatedUsers
                      .filter((user) => canDelete(user))
                      .every((user) => selectedUsers.includes(user.id)) &&
                    paginatedUsers.filter((user) => canDelete(user)).length > 0
                  }
                  isIndeterminate={
                    selectedUsers.length > 0 &&
                    paginatedUsers.filter((user) => canDelete(user)).some((user) =>
                      selectedUsers.includes(user.id)
                    ) &&
                    !paginatedUsers
                      .filter((user) => canDelete(user))
                      .every((user) => selectedUsers.includes(user.id))
                  }
                  onChange={handleSelectAll}
                  isDisabled={paginatedUsers.filter((user) => canDelete(user)).length === 0}
                />
              </Th>
              <Th>ID</Th>
              <Th>Email</Th>
              <Th>Nama Lengkap</Th>
              <Th>Inisial</Th>
              <Th>Departement</Th>
              <Th>Jabatan</Th>
              <Th>User Role</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedUsers.map((user) => (
              <Tr key={user.id} borderBottom="1px solid" borderColor={borderColor}>
                <Td>
                  <Checkbox
                    isChecked={selectedUsers.includes(user.id)}
                    onChange={() => handleCheckboxChange(user.id)}
                    isDisabled={!canDelete(user)}
                  />
                </Td>
                <Td>{user.id}</Td>
                <Td>{user.email}</Td>
                <Td>{user.nama_lengkap}</Td>
                <Td>{user.inisial}</Td>
                <Td>{user.departement}</Td>
                <Td>{user.jabatan}</Td>
                <Td>{user.userrole}</Td>
                <Td>
                  <Flex gap={2}>
                    {canEdit(user) && (
                      <Button colorScheme="blue" size="sm" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                    )}
                    {canDelete(user) && (
                      <Button colorScheme="red" size="sm" onClick={() => handleDelete(user.id)}>
                        Delete
                      </Button>
                    )}
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <HStack justify="center" mt={4}>
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          isDisabled={currentPage === 1}
        >
          Prev
        </Button>
        <Text>
          Halaman {currentPage} dari {totalPages}
        </Text>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          isDisabled={currentPage === totalPages}
        >
          Next
        </Button>
      </HStack>

      {/* Modal Edit */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={3}>
              <Input
                placeholder="Nama"
                name="nama_lengkap"
                value={editingUser?.nama_lengkap || ""}
                onChange={handleChange}
                readOnly
              />
              <Input
                placeholder="Email"
                name="email"
                value={editingUser?.email || ""}
                onChange={handleChange}
                readOnly
              />
              <Select
                placeholder="Pilih Role"
                name="userrole"
                value={editingUser?.userrole || ""}
                onChange={handleChange}
              >
                {isSuperAdmin && <option value="super admin">Super Admin</option>}
                {(isAdmin || isSuperAdmin) && <option value="admin">Admin</option>}
                {(isAdmin || isSuperAdmin) && <option value="user">User</option>}
              </Select>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Batal
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AlertDialog Multi Delete */}
      <AlertDialog
        isOpen={isMultiDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onMultiDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Konfirmasi Hapus</AlertDialogHeader>
            <AlertDialogBody>
              Apakah Anda yakin ingin menghapus {selectedUsers.length} user terpilih?
              {isAdmin && selectedUsers.some(id => users.find(u => u.id === id)?.userrole === "super admin") && (
                <Text mt={2} color="red.400">
                  Catatan: Admin tidak bisa menghapus Super Admin. Super Admin yang dipilih akan diabaikan.
                </Text>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onMultiDeleteClose}>
                Batal
              </Button>
              <Button colorScheme="red" onClick={handleMultiDelete} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* AlertDialog Single Delete */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Konfirmasi Hapus</AlertDialogHeader>
            <AlertDialogBody>
              Apakah Anda yakin ingin menghapus user ini?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Batal
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}