import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, Input, FormControl, FormLabel, Image, Heading, Text, Flex, Link, useColorMode, Stack, Alert, AlertIcon, useToast } from "@chakra-ui/react";
import DOMPurify from 'dompurify';
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";
function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { colorMode } = useColorMode();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = DOMPurify.sanitize(value);
    setFormData({
      ...formData,
      [name]: sanitizedValue,
    });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const { email, password } = formData;
        const response = await axios.post( `${process.env.REACT_APP_API_BASE_URL}/users/Login`, 
          { email, password }, 
          { withCredentials: true } 
        );
    
        const userData = response.data.user;
    
        dispatch(setUser(userData)); // <-- hanya ini cukup
    
        navigate("/Home");
        toast({
          title: "Login berhasil!",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
      } catch (error) {
        setError(error.response?.data?.error || "Invalid email or password");
      }
    };
    
    

  return (
    <Flex height="100vh" alignItems="center" justifyContent="center">
      <Box
        width={{ base: "90%", sm: "80%", md: "70%", lg: "60%", xl: "50%" }}
        maxW="md"
        p={5}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
      >
        <Image src={colorMode === "light" ? "/kch.png" : "/sakahitam.png"} alignItems={"center"} w={100} h={10} />
        <Heading as="h1" mb={6} textAlign="center">
          Login
        </Heading>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </FormControl>
            <Text mb="0" p="0" textAlign="center">
              <FormLabel color={colorMode === "light" ? "blue" : "white"} mb="0">
                Belum Punya Akun?{" "}
                <Link color={colorMode === "light" ? "blue.500" : "teal.200"} onClick={() => navigate("/Register")} p="0" m="0">
                  Register
                </Link>
              </FormLabel>
            </Text>
            <Text mb="0" p="0" textAlign="center">
              <FormLabel color={colorMode === "light" ? "blue" : "white"} mb="0">
                Lupa Password?{" "}
                <Link color={colorMode === "light" ? "blue.500" : "teal.200"} onClick={() => navigate("/request-password-reset")} p="0" m="0">
                  Forgot Password
                </Link>
              </FormLabel>
            </Text>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </Alert>
            )}
            <Button type="submit" colorScheme="teal" width="full">
              Login
            </Button>
          </Stack>
        </form>
      </Box>
    </Flex>
  );
}

export default Login;