/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import styles from '../styles/videoComponet.module.css';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
const server_url = import.meta.env.VITE_SERVER_URL;


var connections = {};

// const peerConfigConnections = {
//     "iceServers": [
//         { "urls": "stun:stun.l.google.com:19302" }
//     ]
// }

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }
    ]
};



export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    let routeTo = useNavigate();

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    }, []);


    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);
        }

    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }


    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }



   let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch(console.log);
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {
                console.log("Error in stopping the stream", e);
            }
        }
    };



    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }



 const addMessage = (data, sender, socketIdSender) => {
    setMessages(prev => [
        ...prev,
        { sender, data, socketIdSender }
    ]);

    if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
};

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', { room: window.location.href, username });
            socketIdRef.current = socketRef.current.id

            socketRef.current.off('chat-message');
            socketRef.current.on('chat-message', (msg) => {
                console.log("CHAT MESSAGE RECEIVED", msg);
                if (msg && msg.room === window.location.href) {
                    addMessage(msg.data, msg.sender, msg["socket-id-sender"]);
                }
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                console.log("clients", clients);
                clients.forEach((client) => {
                    const socketListId = client.socketId;
                    const username = client.username;

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId
                                        ? { ...video, stream: event.stream, username }
                                        : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                username, // <-- add username here!
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { console.log(e) }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            });
        })
    }


    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

 let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    let track = stream.getVideoTracks()[0];
    return Object.assign(track, { enabled: false });
};



    
let connect = () => {
    setAskForUsername(false);
    console.log("[RTC] connect clicked, calling getMedia...");
    getMedia();
}



let handleVideo = () =>{
        setVideo(!video);
}

let handleAudio = () =>{
    setAudio(!audio);
}






let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
}

let getDisplayMedia = () => {
    if(screen) {
        if(navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        }
    }
}

useEffect(() => {
    if (screen !== undefined) {
        getDisplayMedia();
    }
}, [screen]);

    let handleScreen = () => {
        setScreen(!screen);
    }
    
    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

   let handleEndCall = () => {
    try {
        // 1. Clear all messages and video state
        setMessages([]);
        setVideos([]);
        if (videoRef.current) videoRef.current = [];

        // 2. Close all peer connections
        if (connections) {
            Object.values(connections).forEach(conn => {
                try { conn.close(); } catch (e) { console.log("Error closing connection", e); }
            });
            connections = {};
        }

        // 3. Stop all local media tracks
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = null;
        }

        // 4. Remove all socket listeners and disconnect
        if (socketRef.current) {
            socketRef.current.off();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // 5. Reset UI and user state
        setVideoAvailable(false);
        setAudioAvailable(false);
        setVideo(false);
        setAudio(false);
        setScreen(false);
        setScreenAvailable(false);
        setAskForUsername(true);
        setUsername("");
        setModal(false);
        setNewMessages(0);

    } catch (e) {
        console.log("Error in stopping the stream", e);
    }

    // 6. Route away from the call
    routeTo("/home");
}

    
    return (
        <div>

            {askForUsername === true ? 

                <div>

                    <h2 style={{textAlign: "center" , fontSize: "40px", color: "rgb(223 223 223)"}}>Enter into Lobby </h2>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "20px", gap: "12px"}}>
                       <TextField
                            id="outlined-basic"
                            label="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            variant="outlined"
                            InputLabelProps={{
                                style: { color: 'white' }, // Label color
                            }}
                            sx={{
                                input: { color: 'white' }, // Text inside input
                                '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'blue', // Default border
                                },
                                '&:hover fieldset': {
                                    borderColor: 'blue', // Hover border
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'blue', // Focused border
                                },
                                },
                            }}
                            />

                        <Button variant="contained" onClick={connect}>Connect</Button>
                    </div>


                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px" }}>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>

                </div> : 
                <div className={styles.meetVideoContainer}>

                    {showModal === true ? 
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1 style={{textAlign: "center"}}>Chat Box</h1>

                                 <div className={styles.chattingDisplay}>
                                {console.log("MESSAGES", messages)}
                                {messages.length !== 0 ? messages.map((msg, index) => {

                                    console.log(messages)
                                    return (
                                        <div className={styles.chatSent} style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold", fontSize: "13px"}}><span style={{fontSize : "15px"}}>~</span>{msg.sender}</p>
                                            <p style={{textAlign: "left"}}>{msg.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>


                                <div className={styles.chatInputContainer}>
                                    <TextField
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        id="outlined-basic"
                                        label="Enter your Message"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiInputBase-input': {
                                            color: 'black', // Text color inside input
                                            },
                                            '& .MuiInputLabel-root': {
                                            color: 'black', // Label color by default
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                            color: '#414345', // Label color when focused
                                            },
                                            '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: '#ccc', // Default border color
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#414345', // Hover border color
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#414345', // Focused border color
                                            },
                                            },
                                        }}
                                    />
                                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    : <></>}

                    <div className={styles.buttonContainer}>
                        <IconButton 
                                onClick={handleAudio} 
                                style={{ color: audio ? 'green' : 'red' }} 
                                aria-label={audio ? "Mute microphone" : "Unmute microphone"}
                            >
                                {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                            <IconButton 
                                onClick={handleVideo} 
                                style={{ color: video ? 'green' : 'red' }} 
                                aria-label={video ? "Turn off camera" : "Turn on camera"}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        { screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: screen ? 'green' : 'red' }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> 
                            : <></>
                        }

                        <Badge badgeContent={newMessages} max={999} color='primary' onClick={() => setNewMessages(0)}>
                            <IconButton onClick={() => {
                                setModal(!showModal);
                            }} style={{ color: 'white' }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        <IconButton onClick={handleEndCall} style={{ color: 'red' }}>
                            <CallEndIcon />
                        </IconButton>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted playsInline></video>
                    
                    <div className={styles.conferenceView}>
                        {console.log("VIDEOS", videos)}
                        {videos.map((video, idx) => {

                            const hasVideo = video.stream && video.stream.getVideoTracks().length > 0;
                            return (
                                <div key={video.socketId} className={styles.remoteVideoWrapper}>
                                    {hasVideo ? (
                                        <video
                                        autoPlay
                                        playsInline
                                        ref={el => {
                                            if (el) el.srcObject = video.stream;
                                        }}
                                        className={styles.remoteVideo}
                                        />
                                    ) : (
                                        <div className={styles.blackPlaceholder}>
                                        <VideocamOffIcon style={{ fontSize: 48, color: "#fff" }} />
                                        </div>
                                    )}
                                <h3 className={styles.userName}>~ {video.username || "Unknown"}</h3>
                                </div>
                            );
                            })}

                    </div>
                </div>
            }

        </div>
    );
}