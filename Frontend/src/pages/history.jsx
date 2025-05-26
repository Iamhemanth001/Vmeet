import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconButton, Button } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import "../App.css"

export default function History() {
    let navigate = useNavigate();
    const {getHistoryOfUser} = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (error) {
                console.error("Error fetching user history:", error);
                routeTo("/auth");
            }
        };
        fetchHistory();
    }, []);
    
    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

  return (
    <div>
        <div className="homePageContainer">
            <nav>
                <div className='navHeader'>
                    <IconButton onClick={
                        () => {
                            navigate("/home")
                        }
                    }>
                        <h2>Vmeet</h2>
                    </IconButton>
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
                        navigate("/")
                    }}>
                        logout
                    </Button>

                    
                </div>
            </nav>
            
            <div className='cardContainer'>
                {meetings.length > 0 ? (
                    <div className="historyContainer">
                        {meetings.map((meeting, index) => (
                            <Card key={index} className="historyCard">
                                <CardContent>
                                    <h3>Meeting Code: {meeting.meetingCode}</h3>
                                    <p>Created At: {formatDate(meeting.date)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <h2>No meeting history found.</h2>
                )
                }

            </div>
        </div>
        
    </div>
  )
}
