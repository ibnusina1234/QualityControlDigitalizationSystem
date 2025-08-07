import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, FormControl, FormLabel, Input, Button, Heading, Alert, AlertIcon } from "@chakra-ui/react";
import { useSelector } from "react-redux"; 

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
     const userRedux = useSelector(state => state.user.user);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        let email = query.get('email');
        const token = query.get('token');
        if (!email && userRedux?.email) {
            email = userRedux.email;
        }

        if (!email) {
            setError("Email tidak ditemukan. Silakan login ulang.");
            return;
        }

        axios.post( `${process.env.REACT_APP_API_BASE_URL}/users/reset-password`, { email, token, newPassword: password })
            .then(response => {
                setMessage(response.data.message);
                setError('');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            })
            .catch(error => {
                setError(error.response?.data?.error || 'Error resetting password');
                setMessage('');
            });
    };

    return (
        <Box className="flex items-center justify-center min-h-screen" pt={20}>
            <Box p={8} maxWidth="400px" width="100%" bg="white" borderRadius="lg" boxShadow="lg">
                <Heading mb={6} textAlign="center" color="teal.600">Reset Password</Heading>
                {message && (
                    <Alert status="success">
                        <AlertIcon />
                        {message}
                    </Alert>
                )}
                {error && (
                    <Alert status="error">
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
                        />
                    </FormControl>
                    <FormControl mt={4}>
                        <FormLabel>Confirm Password</FormLabel>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </FormControl>
                    <Button type="submit" colorScheme="teal" width="full" mt={4}>
                        Submit
                    </Button>
                </form>
            </Box>
        </Box>
    );
}

export default ResetPassword;