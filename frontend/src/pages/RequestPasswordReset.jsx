import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
      Box,
      FormControl,
      FormLabel,
      Input,
      Button,
      Heading,
      Alert,
      AlertIcon,
      Flex
} from "@chakra-ui/react";

function RequestPasswordReset() {
      const [email, setEmail] = useState('');
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');
      const [cooldownTime, setCooldownTime] = useState(0);

      const handleSubmit = (e) => {
            e.preventDefault();

            axios.post(`${process.env.REACT_APP_API_BASE_URL}/users/request-password-reset`, { email })
                  .then(response => {
                        setMessage(response.data.message);
                        setError('');
                        setCooldownTime(60); // Set cooldown ke 60 detik
                  })
                  .catch(error => {
                        setError(error.response?.data?.error || 'Error requesting password reset');
                        setMessage('');
                        setCooldownTime(60); // Tetap cooldown untuk cegah spam meskipun error
                  });
      };

      useEffect(() => {
            if (cooldownTime > 0) {
                  const interval = setInterval(() => {
                        setCooldownTime(prev => prev - 1);
                  }, 1000);
                  return () => clearInterval(interval);
            }
      }, [cooldownTime]);

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
                        <Heading as="h1" mb={6} textAlign="center">
                              Request Password Reset
                        </Heading>
                        {message && (
                              <Alert status="success" mb={4}>
                                    <AlertIcon />
                                    {message}
                              </Alert>
                        )}
                        {error && (
                              <Alert status="error" mb={4}>
                                    <AlertIcon />
                                    {error}
                              </Alert>
                        )}
                        <form onSubmit={handleSubmit}>
                              <FormControl id="email" mb={4}>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                          type="email"
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          required
                                          disabled={cooldownTime > 0}
                                    />
                              </FormControl>
                              <Button
                                    type="submit"
                                    colorScheme="teal"
                                    width="full"
                                    isDisabled={cooldownTime > 0}
                              >
                                    {cooldownTime > 0 ? `Please wait ${cooldownTime}s` : 'Submit'}
                              </Button>
                        </form>
                  </Box>
            </Flex>
      );
}

export default RequestPasswordReset;
