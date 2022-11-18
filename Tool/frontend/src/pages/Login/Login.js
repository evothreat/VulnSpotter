import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Copyright from "./Copyright";
import {Alert} from "@mui/material";
import {useState} from "react";
import AuthService from "../../services/AuthService";
import {useNavigate} from "react-router-dom";


const theme = createTheme();

export default function Login() {
    const navigate = useNavigate();
    const [showError, setShowError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        AuthService.login(e.target.username.value, e.target.password.value)
            .then(() => {
                navigate('/home');

            }).catch((err) => {
                if (err.response?.status === 401) {
                    setShowError(true);
                }
            })
    };

    return (
        <ThemeProvider theme={theme}>
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
                            id="username"
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
                            id="password"
                            autoComplete="current-password"
                        />
                        { showError ? <Alert severity="error">Wrong username or password!</Alert> : null }
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: '16px', mb: '16px'}}
                        >
                            Sign In
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href="src/pages/Login/Login#" variant="body2">
                                    Forgot password?
                                </Link>
                            </Grid>
                            <Grid item>
                                <Link href="src/pages/Login/Login#" variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
                <Copyright sx={{mt: '64px', mb: '32px'}}/>
            </Container>
        </ThemeProvider>
    );
}
