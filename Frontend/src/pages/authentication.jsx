import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../context/AuthContext.jsx';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import "../App.css"
import { useNavigate } from 'react-router-dom';


// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {

    
    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    // ✅ Initializing state variables properly to avoid "uncontrolled input" warnings
    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false)


    // ✅ Handle Authentication
    let handleAuth = async () => {
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                // console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {

            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }

    // ✅ Snackbar Close Handler
    const handleCloseSnackbar = () => {
        setOpen(false);
    };

    function generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    const router = useNavigate();
    return (
        <div className='authenticationPageContainer'>
        
                <nav className='nav'>
                    <div className='navHeader'>
                        <h2 onClick={() => {
                            router('/');
                        }} >Vmeet</h2>
                    </div>

                    <div className='navList'>
                        <p  onClick={() => {
                            const randomString = generateRandomString(5);
                            router(`/${randomString}`);
                        }}>Join as Guest</p>

                        <p onClick={() =>{
                            router('/auth');
                        }} >Register</p>

                        <div role='button'
                            onClick={() => {
                                router('/auth');
                            }}>
                            <p>Login</p>
                        </div>
                    </div>
                </nav>

            <ThemeProvider theme={defaultTheme}>
                <Grid container component="main" sx={{ height: '90.1vh' }}>
                    <CssBaseline />
                    
                    {/* Left-side Image Panel */}
                    <Grid
                        item
                        xs={false}
                        sm={4}
                        md={7}
                        sx={{
                            height: '90.1vh',
                            width: '60%',
                            backgroundImage: 'url(/login.png)',
                            // backgroundImage: 'url(https://images.unsplash.com/vector-1739369767407-e24e72cf4891?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    
                    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ width: '40%',backgroundColor: '#f0efeb' }}>
                        
                        <Box
                            sx={{
                                my: 8,
                                mx: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                        }}
                        >
                            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                                <LockOutlinedIcon />
                            </Avatar>


                            <div>
                                <Button variant={formState === 0 ? "contained" : ""} onClick={() => { setFormState(0) }}>
                                    Sign In
                                </Button>
                                <Button variant={formState === 1 ? "contained" : ""} onClick={() => { setFormState(1) }}>
                                    Sign Up
                                </Button>
                            </div>

                            <Box component="form" noValidate sx={{ mt: 1 }}>
                                {formState === 1 ? <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Full Name"
                                    name="username"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                /> : <></>}

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    value={username}
                                    autoFocus
                                    onChange={(e) => setUsername(e.target.value)}

                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    value={password}
                                    type="password"
                                    onChange={(e) => setPassword(e.target.value)}

                                    id="password"
                                />

                                <p style={{ color: "red" }}>{error}</p>

                                <Button
                                    type="button"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    onClick={handleAuth}
                                >
                                    {formState === 0 ? "Login " : "Register"}
                                </Button>

                            </Box>
                        </Box>
                    </Grid>
                </Grid>

            {/* Snackbar for Success Message */}
                <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={handleCloseSnackbar}
                    message={message}
                    action={
                        <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
                            <CloseIcon />
                        </IconButton>
                    }
                />

            </ThemeProvider>
        </div>
    );
}