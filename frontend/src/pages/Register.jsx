import React, { useState, useEffect } from "react";
import {
      Box,
      Button,
      FormControl,
      FormLabel,
      Input,
      Heading,
      useColorMode,
      Stack,
      Alert,
      Select,
      AlertIcon,
      useToast,
      Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DOMPurify from "dompurify";


const Register = () => {
      const [formData, setFormData] = useState({
            email: "",
            nama_lengkap: "",
            inisial: "",
            departement: "",
            jabatan: "",
            password: "",
            konfirmasi_password: "",
            img: null,
      });

      const [error, setError] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const { colorMode } = useColorMode();
      const navigate = useNavigate();
      const toast = useToast();
      const [roles, setRoles] = useState([]);

      useEffect(() => {
            const fetchRoles = async () => {
                  try {
                        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/roles`, {
                              withCredentials: true,
                        });
                        const simplified = response.data.map(role => ({
                              role_key: role.role_key,
                              role_name: role.role_name
                        }));
                        setRoles(simplified);
                  } catch (error) {
                        console.error('Gagal fetch role:', error);
                  }
            };

            fetchRoles();
      }, []);

      const checkEmailExists = async (email) => {
            try {
                  const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/users/check-email`, { email });
                  return response.data.exists;
            } catch (error) {
                  console.error("Error checking email:", error);
                  return false;
            }
      };

      const handleChange = (e) => {
            const { name, value } = e.target;
            const sanitizedValue = DOMPurify.sanitize(value);
            setFormData((prev) => ({
                  ...prev,
                  [name]: sanitizedValue,
            }));
      };

      const handleFileChange = (e) => {
            const file = e.target.files[0];
            setFormData((prevFormData) => ({
                  ...prevFormData,
                  img: file,
            }));
      };

      const validatePassword = (password) => {
            const capitalLetterRegex = /^[A-Z]/;
            const numberRegex = /[0-9]/;
            return capitalLetterRegex.test(password) && numberRegex.test(password);
      };

      // Daftar jabatan berdasarkan departemen
      const jabatanOptions = {
            Produksi: ['OPERATOR PRODUKSI', 'SUPERVISOR PRODUKSI', 'MANAGER PRODUKSI', "ADMIN PRODUKSI"],
            QC: ["ANALIS FG", "ANALIS RM", "ANALIS MIKROBIOLOGI", "INSPEKTOR QC", "ADMIN QC", 'SUPERVISOR QC', 'MANAGER QC'],
            QA: ['INSPEKTOR QA', 'ADMIN QA', 'SUPERVISOR QA', 'MANAGER QA'],
            WH: ['OPERATOR WH', 'SUPERVISOR WH', 'ADMIN WH', 'MANAGER WH'],
            RND: ['ADMIN RND', 'ANALIS RND', 'SUPERVISOR RND', 'MANAGER RND'],
            TEKNIK: ['ADMIN TEKNIK', 'SUPERVISOR TEKNIK', 'MANAGER TEKNIK', 'TEKNISI'],
            QS: ['ADMIN QS', 'SUPERVISOR QC', 'MANAGER QS', 'STAFF QS'],
      };

      const handleRegister = async () => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            setError("");

            const {
                  email,
                  nama_lengkap,
                  inisial,
                  departement,
                  jabatan,
                  password,
                  konfirmasi_password,
                  role,
                  img,
            } = formData;

            if (password !== konfirmasi_password) {
                  setError("Password dan konfirmasi tidak cocok.");
                  setIsSubmitting(false);
                  return;
            }

            if (!validatePassword(password)) {
                  setError("Password minimal 6 karakter. harus diawali huruf besar,huruf kecil, mengandung angka dan simbol.");
                  setIsSubmitting(false);
                  return;
            }

            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                  setError("Email sudah terdaftar. Gunakan email lain.");
                  setIsSubmitting(false);
                  return;
            }
            if (!role) {
                  setError("Role utama harus dipilih.");
                  setIsSubmitting(false);
                  return;
            }


            const formDataToSubmit = new FormData();
            formDataToSubmit.append("email", email);
            formDataToSubmit.append("nama_lengkap", nama_lengkap);
            formDataToSubmit.append("inisial", inisial);
            formDataToSubmit.append("departement", departement);
            formDataToSubmit.append("jabatan", jabatan);
            formDataToSubmit.append("password", password);
            formDataToSubmit.append("role", role);
            if (img) {
                  formDataToSubmit.append("img", img);
            }

            try {
                  await axios.post(`${process.env.REACT_APP_API_BASE_URL}/users/Register`, formDataToSubmit, {
                        headers: { "Content-Type": "multipart/form-data" },
                  });

                  toast({
                        title: "Registrasi berhasil!",
                        description: "Menunggu persetujuan admin.",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                  });

                  setTimeout(() => {
                        navigate("/Home");
                  }, 2000);

            } catch (error) {
                  console.error("Error during registration:", error);
                  setError(error.response?.data?.error || "Gagal mendaftar.");
            } finally {
                  setIsSubmitting(false);
            }
      };

      return (
            <Box
                  className="flex items-center justify-center min-h-screen"
                  bg={colorMode === "light" ? "gray.100" : "gray.900"}
                  color={colorMode === "light" ? "black" : "white"}
                  pt={20}
            >
                  <Box
                        p={8}
                        maxWidth="500px"
                        width="100%"
                        bg={colorMode === "light" ? "white" : "gray.800"}
                        borderRadius="lg"
                        boxShadow="lg"
                  >
                        <Heading mb={6} textAlign="center" color={colorMode === "light" ? "teal.600" : "teal.400"}>
                              Register
                        </Heading>
                        <Stack spacing={4}>
                              {error && (
                                    <Alert status="error">
                                          <AlertIcon />
                                          {error}
                                    </Alert>
                              )}
                              <FormControl isRequired>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Masukkan email" />
                              </FormControl>
                              <FormControl isRequired>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <Input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Nama lengkap" />
                              </FormControl>
                              <FormControl isRequired>
                                    <FormLabel>Inisial</FormLabel>
                                    <Input type="text" name="inisial" value={formData.inisial} onChange={handleChange} placeholder="Inisial" />
                              </FormControl>
                              <FormLabel>Departement</FormLabel>
                              <Select
                                    name="departement"
                                    value={formData.departement}
                                    onChange={handleChange}
                                    placeholder="Pilih departement"
                              >
                                    <option value="QC">QC</option>
                                    <option value="QA">QA</option>
                                    <option value="WH">WH</option>
                                    <option value="TEKNIK">TEKNIK</option>
                                    <option value="QS">QS</option>
                                    <option value="RND">RND</option>
                              </Select>
                              <FormControl isRequired>
                                    <FormLabel>Jabatan</FormLabel>
                                    <Select
                                          name="jabatan"
                                          value={formData.jabatan}
                                          onChange={handleChange}
                                          placeholder="Pilih Jabatan"
                                          isDisabled={!formData.departement}
                                    >
                                          {(jabatanOptions[formData.departement] || []).map((jabatan) => (
                                                <option key={jabatan} value={jabatan}>
                                                      {jabatan}
                                                </option>
                                          ))}
                                    </Select>
                              </FormControl>
                              <FormControl isRequired>
                                    <FormLabel>Password</FormLabel>
                                    <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
                              </FormControl>
                              <FormControl isRequired>
                                    <FormLabel>Konfirmasi Password</FormLabel>
                                    <Input type="password" name="konfirmasi_password" value={formData.konfirmasi_password} onChange={handleChange} placeholder="Ulangi password" />
                              </FormControl>
                              <FormControl>
                                    <FormLabel>Gambar Profil</FormLabel>
                                    <Input type="file" name="img" onChange={handleFileChange} />
                              </FormControl>
                              {/* Tambahan ceklis akses user */}
                              <FormControl isRequired>
                                    <FormLabel>Role Utama</FormLabel>
                                    <Select
                                          name="role"
                                          value={formData.role || ""}
                                          onChange={handleChange}
                                          placeholder="Pilih role utama"
                                    >
                                          {roles.map((opt) => (
                                                <option key={opt.role_key} value={opt.role_key}>
                                                      {opt.role_name}
                                                </option>
                                          ))}
                                    </Select>
                              </FormControl>
                              <Button
                                    colorScheme="teal"
                                    width="full"
                                    onClick={handleRegister}
                                    isLoading={isSubmitting}
                                    loadingText="Mendaftarkan..."
                              >
                                    Register
                              </Button>
                              {isSubmitting && <Spinner size="md" color="teal.500" />}
                        </Stack>
                  </Box>
            </Box>
      );
};

export default Register;