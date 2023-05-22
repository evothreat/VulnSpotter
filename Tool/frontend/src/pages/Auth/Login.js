import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {Alert} from "@mui/material";
import {useState} from "react";
import AuthService from "../../services/AuthService";
import {useNavigate} from "react-router-dom";



export default function Login() {
    const navigate = useNavigate();
    const [showError, setShowError] = useState(false);

    const handleSubmit = e => {
        e.preventDefault();

        AuthService.login(e.target.username.value, e.target.password.value)
            .then(() => {
                navigate('/home/projects');

            }).catch(err => {
            if (err.response?.status === 401) {
                setShowError(true);
            }
        })
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline/>
            <Box sx={{
                mt: '25%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            >
                <Avatar sx={{m: '8px', bgcolor: 'secondary.main'}}>
                    <LockOutlinedIcon/>
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: '8px'}}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                    />
                    {showError ? <Alert severity="error">Invalid username or password.</Alert> : null}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: '16px', mb: '16px'}}
                    >
                        Sign In
                    </Button>
                    <Box sx={{display: 'flex', justifyContent: 'center'}}>
                        <Link href="/register" variant="body2">
                            Don't have an account? Sign Up
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
