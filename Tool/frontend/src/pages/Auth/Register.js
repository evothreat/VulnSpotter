import * as React from 'react';
import {useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {Alert} from "@mui/material";
import AuthService from "../../services/AuthService";
import {useNavigate} from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


export default function Register() {
    const navigate = useNavigate();
    const [errMessage, setErrMessage] = useState(null);

    const handleSubmit = e => {
        e.preventDefault();

        AuthService.register(
            e.target.full_name.value, e.target.username.value,
            e.target.email.value, e.target.password.value
        )
            .then(() => {
                navigate('/login');

            }).catch(err => {
            if (err.response?.status === 409) {
                setErrMessage("Username already exists.");
            }
            else if (err.response?.status === 422) {
                setErrMessage("Please check your input.");
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
                    <AccountCircleIcon/>
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: '8px'}}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Full name"
                        name="full_name"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Username"
                        name="username"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="email"
                        label="E-Mail"
                        type="email"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password (min. 6 characters)"
                        type="password"
                    />
                    {
                        errMessage && <Alert severity="error">{errMessage}</Alert>
                    }
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: '16px', mb: '16px'}}
                    >
                        Sign Up
                    </Button>
                    <Box sx={{display: 'flex', justifyContent: 'center'}}>
                        <Link href="/login" variant="body2">
                            Have an account already? Sign in
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
