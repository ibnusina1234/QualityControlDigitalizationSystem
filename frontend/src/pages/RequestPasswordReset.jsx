import React, { useState } from 'react';
import axios from 'axios';
import { Box, FormControl, FormLabel, Input, Button, Heading, Alert, AlertIcon, Flex } from "@chakra-ui/react";

function RequestPasswordReset() {
      const [email, setEmail] = useState('');
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');

      const handleSubmit = (e) => {
            e.preventDefault();
            axios.post( `${process.env.REACT_APP_API_BASE_URL}/users/request-password-reset`, { email })
                  .then(response => {
                        setMessage(response.data.message);
                        setError('');
                  })
                  .catch(error => {
                        setError(error.response?.data?.error || 'Error requesting password reset');
                        setMessage('');
                  });
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
                                    />
                              </FormControl>
                              <Button type="submit" colorScheme="teal" width="full">
                                    Submit
                              </Button>
                        </form>
                  </Box>
            </Flex>
      );
}

export default RequestPasswordReset;