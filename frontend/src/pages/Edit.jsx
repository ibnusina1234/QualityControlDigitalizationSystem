import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  Center,
  useColorMode,
  Text,
  Select,
} from "@chakra-ui/react";
import DOMPurify from "dompurify";
import { useSelector } from "react-redux"; // ✅ Redux hook

function EditProfile() {
  const [user, setUser] = useState({
    email: "",
    nama_lengkap: "",
    inisial: "",
    departement: "",
    jabatan: "",
    userrole: "",
    img: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const reduxUser = useSelector((state) => state.user.user); // ✅ Ambil user dari Redux
  const currentUserRole = reduxUser?.userrole;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get( `${process.env.REACT_APP_API_BASE_URL}/users/Profile`, {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile. Please try again later.");
      }
    };
    fetchProfile();
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = DOMPurify.sanitize(value);
    setUser((prevUser) => ({
      ...prevUser,
      [name]: sanitizedValue,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUser((prevUser) => ({
      ...prevUser,
      img: file,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const formData = new FormData();
  formData.append("email", user.email);
  formData.append("nama_lengkap", user.nama_lengkap);
  formData.append("inisial", user.inisial);
  formData.append("departement", user.departement);
  formData.append("jabatan", user.jabatan);

  if (user.img) { // hanya saat ada file
    formData.append("img", user.img);
  }

  if (currentUserRole === "admin" && user.userrole) { // hanya kalau ada dan valid
    formData.append("userrole", user.userrole);
  }

  try {
    await axios.put(
      `${process.env.REACT_APP_API_BASE_URL}/users/profile`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    alert("Profil berhasil diperbarui!");
    navigate("/Profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    setError("Gagal memperbarui profil. Silakan coba lagi nanti.");
  }
  setIsLoading(false);
};

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!user) {
    return <Text>Loading...</Text>;
  }

  return (
    <Center height="100vh" mt="20">
      <Box
        width={["90%", "80%", "60%", "40%"]}
        bg={colorMode === "light" ? "gray.200" : "gray.700"}
        boxShadow="xl"
        borderRadius="md"
        overflow="hidden"
        p={5}
        mt="50"
      >
        <Center mb={5}>
          <Avatar
            src={
              user.img
                ? `${process.env.REACT_APP_API_BASE_URL}/${user.img}`
                : "/default-profile.png"
            }
            name={user.nama_lengkap}
            boxSize="150px"
          />
        </Center>
        <form onSubmit={handleSubmit}>
          <FormControl id="email" mb={4}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl id="nama_lengkap" mb={4}>
            <FormLabel>Nama Lengkap</FormLabel>
            <Input
              type="text"
              name="nama_lengkap"
              value={user.nama_lengkap}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl id="inisial" mb={4}>
            <FormLabel>Inisial</FormLabel>
            <Input
              type="text"
              name="inisial"
              value={user.inisial}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl id="departement" mb={4}>
            <FormLabel>Departement</FormLabel>
            <Input
              type="text"
              name="departement"
              value={user.departement}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl id="jabatan" mb={4}>
            <FormLabel>Jabatan</FormLabel>
            <Input
              type="text"
              name="jabatan"
              value={user.jabatan}
              onChange={handleChange}
              required
            />
          </FormControl>

          {currentUserRole === "admin" && (
            <FormControl id="userrole" mb={4}>
              <FormLabel>User Role</FormLabel>
              <Select
                name="userrole"
                value={user.userrole}
                onChange={handleChange}
                placeholder="-- Pilih Role --"
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="super admin">Super Admin</option>
              </Select>
            </FormControl>
          )}

          <FormControl id="img" mb={4}>
            <FormLabel>Gambar Profil</FormLabel>
            <Input type="file" name="img" onChange={handleFileChange} />
          </FormControl>

          <Button
            colorScheme="teal"
            isLoading={isLoading}
            type="submit"
            width="full"
          >
            Perbarui Profil
          </Button>
        </form>
      </Box>
    </Center>
  );
}

export default EditProfile;
