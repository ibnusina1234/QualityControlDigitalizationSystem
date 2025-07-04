import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const email = query.get('email');
    const token = query.get('token');

    axios.post(`${process.env.REACT_APP_API_BASE_URL}/users/reset-password`, {
      email,
      token,
      newPassword: password
    })
      .then(response => {
        setMessage(response.data.message);
        setError('');
        setCooldownTime(5); // set ke 5 detik agar cepat kelihatan saat testing
      })
      .catch(error => {
        setError(error.response?.data?.error || 'Error resetting password');
        setMessage('');
        setCooldownTime(5); // tetap cooldown walau gagal
      });
  };

  useEffect(() => {
    if (cooldownTime > 0) {
      const interval = setInterval(() => {
        setCooldownTime(prev => {
          const next = prev - 1;
          if (next === 0 && message) {
            navigate('/login');
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTime, message, navigate]);

  return (
    <Box className="flex items-center justify-center min-h-screen" pt={20}>
      <Box p={8} maxWidth="400px" width="100%" bg="white" borderRadius="lg" boxShadow="lg">
        <Heading mb={6} textAlign="center" color="teal.600">Reset Password</Heading>
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
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={cooldownTime > 0}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={cooldownTime > 0}
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="teal"
            width="full"
            mt={4}
            isDisabled={cooldownTime > 0}
          >
            {cooldownTime > 0 ? `Please wait ${cooldownTime}s` : 'Submit'}
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default ResetPassword;
