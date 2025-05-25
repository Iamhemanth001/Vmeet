/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { IconButton, Button, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import "../App.css"
import { AuthContext } from '../context/AuthContext.jsx';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    
    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        try {
            await addToUserHistory(meetingCode);
            console.log("Meeting code added to user history:", meetingCode);
            navigate(`/${meetingCode}`);
        } catch (e) {
            console.error("Error while adding to user history:", e.response?.data || e.message || e);
            navigate(`/${meetingCode}`);
        }
    };

  return (
     <div className="homePageContainer">
            <nav>
                <div className='navHeader'>
                    <h2>Vmeet</h2>
                </div>

                <div className='navList'>
                     <IconButton onClick={
                            () => {
                                navigate("/history")
                            }
                        }>
                        <RestoreIcon />
                    <p>History</p>
                    </IconButton>

                    <Button style={{fontSize: "1.2rem"}} onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        logout
                    </Button>

                    
                </div>
            </nav>
                
             <div className="homeMainContainer">

                <div>
                    <div className='homeTextContainer'>
                        <h2>Vmeet</h2>
                        <p>Connecting minds through screens <br />just like classrooms connect <span style={{color: "red"}}>hearts</span></p>
                    </div>

                    <div className='joinMeetingContainer'>
                        <h2>Join a Meeting </h2>
                        <div className='joinMeetingInputContainer'>
                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" 
                                sx={{
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'white',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#FF9839', 
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#FF9839', 
                                    },
                                    },
                                    '& label.Mui-focused': {
                                    color: '#FF9839',
                                    },
                            }}/>
                            <Button onClick={handleJoinVideoCall} variant='contained'
                            sx={{
                                color: 'white',       
                                backgroundColor: '#FF9839',
                                '&:hover': {
                                backgroundColor: '#f0f0f0',
                                },
                            }}>Join</Button>
                        </div>

                    </div>
                </div> 

                <div>
                    <img src="/homeImg.png" alt="moblie"/>
                </div>
        </div>
                
            </div>
  )
}

export default withAuth(HomeComponent);