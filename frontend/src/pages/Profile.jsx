import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, Button, Avatar, Center, useColorMode } from "@chakra-ui/react";

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/Profile`, {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile. Please try again later.");
      }
    };

    fetchProfile();
  }, []); // kosong berarti jalan sekali saat pertama render

  const handleEdit = () => {
    if (user && user.id) {
      navigate(`/Edit?userId=${user.id}`);
    }
  };

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!user) {
    return <Text>Loading...</Text>;
  }

  return (
    <Center height="100vh">
      <Box
        width={["90%", "80%", "60%", "40%"]}
        bg={colorMode === "light" ? "gray.200" : "gray.700"}
        boxShadow="xl"
        borderRadius="md"
        overflow="hidden"
        p={5}
        textAlign="center"
      >
        <Avatar
          src={user.img ?  `${process.env.REACT_APP_API_BASE_URL}/${user.img.replace("public/", "")}` : "/default-profile.png"}
          name={user.nama_lengkap}
          boxSize="150px"
          mb={5}
          mx="auto"
        />

        <Heading as="h1" mb={6}>
          Profile
        </Heading>
        <Text fontSize="lg" mb={2}>
          <strong>Email:</strong> {user.email}
        </Text>
        <Text fontSize="lg" mb={2}>
          <strong>Nama Lengkap:</strong> {user.nama_lengkap}
        </Text>
        <Text fontSize="lg" mb={2}>
          <strong>Inisial:</strong> {user.inisial}
        </Text>
        <Text fontSize="lg" mb={2}>
          <strong>Departement:</strong> {user.departement}
        </Text>
        <Text fontSize="lg" mb={2}>
          <strong>Jabatan:</strong> {user.jabatan}
        </Text>
        <Text fontSize="lg" mb={2}>
          <strong>User Role:</strong> {user.userrole}
        </Text>
        <Button colorScheme="teal" mt={4} onClick={handleEdit}>
          Edit Profil
        </Button>
      </Box>
    </Center>
  );
}

export default Profile;
