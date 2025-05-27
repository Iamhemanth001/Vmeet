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

    let [video, setVideo] = useState(false);

    let [audio, setAudio] = useState(false);

    let [screen, setScreen] = useState(false);

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
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable && video, audio: audioAvailable && audio });
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
        console.log("[RTC] getMedia called, connecting to socket...");
        connectToSocketServer();
    }


let getUserMediaSuccess = (stream) => {
    // Stop previous tracks if any
    if (window.localStream) {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { console.log(e) }
    }

    window.localStream = stream;
    if (localVideoref.current) {
        localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
        if (id === socketIdRef.current) continue;

        // Remove all senders before adding new tracks
        connections[id].getSenders().forEach(sender => {
            connections[id].removeTrack(sender);
        });

        // Add all tracks from the new stream
        stream.getTracks().forEach(track => {
            connections[id].addTrack(track, stream);
        });

        connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                })
                .catch(e => console.log(e));
        });
    }

    stream.getTracks().forEach(track => track.onended = () => {
        setVideo(false);
        setAudio(false);
        if (localVideoref.current && localVideoref.current.srcObject) {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }
        }
    });
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
    console.log(`[RTC][${fromId}] gotMessageFromServer called. Message:`, message);
    var signal = JSON.parse(message);

    if (fromId === socketIdRef.current) {
        console.log(`[RTC][${fromId}] Ignoring own signal`);
        return; // Ignore own signals
    }

    // 1. Connection creation
    if (!connections[fromId]) {
        connections[fromId] = new RTCPeerConnection(peerConfigConnections);
        connections[fromId].oniceconnectionstatechange = () => {
            console.log(`[RTC][${fromId}] ICE state:`, connections[fromId].iceConnectionState);
        };

        console.log(`[RTC][${fromId}] Created new RTCPeerConnection`);

        // 2. Add local tracks
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
                connections[fromId].addTrack(track, window.localStream);
                console.log(`[RTC][${fromId}] Added local track (${track.kind})`);
            });
        } else {
            console.warn(`[RTC][${fromId}] No local stream when adding tracks`);
        }

        // 3. ontrack handler
        connections[fromId].ontrack = (event) => {
            console.log(`[RTC][${fromId}] ontrack fired`, event.streams[0]);
            setVideos(prevVideos => {
                if (prevVideos.some(v => v.socketId === fromId)) return prevVideos;
                return [...prevVideos, {
                    socketId: fromId,
                    stream: event.streams[0],
                    autoplay: true,
                    playsinline: true
                }];
            });
        };

        // 4. ICE candidate handler
        connections[fromId].onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[RTC][${fromId}] Sending ICE candidate`, event.candidate);
                socketRef.current.emit('signal', fromId, JSON.stringify({ ice: event.candidate }));
            }
        };
    }

    // 5. Handle SDP (offer/answer)
    if (signal.sdp) {
        console.log(`[RTC][${fromId}] Received SDP (${signal.sdp.type})`);
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
            console.log(`[RTC][${fromId}] Set remote description`);
            if (signal.sdp.type === 'offer') {
                connections[fromId].createAnswer().then((description) => {
                    console.log(`[RTC][${fromId}] Created answer`);
                    connections[fromId].setLocalDescription(description).then(() => {
                        console.log(`[RTC][${fromId}] Set local description (answer), sending to remote`);
                        socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                    }).catch(e => console.log(`[RTC][${fromId}] Error setting local description (answer):`, e));
                }).catch(e => console.log(`[RTC][${fromId}] Error creating answer:`, e));
            }
        }).catch(e => console.log(`[RTC][${fromId}] Error setting remote description:`, e));
    }

    // 6. Handle ICE candidate
    if (signal.ice) {
        console.log(`[RTC][${fromId}] Received ICE candidate`, signal.ice);
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
            .then(() => console.log(`[RTC][${fromId}] Added ICE candidate`))
            .catch(e => console.log(`[RTC][${fromId}] Error adding ICE candidate:`, e));
    }
};



 const addMessage = (data, sender, socketIdSender) => {
    setMessages(prev => [
        ...prev,
        { sender, data, socketIdSender }
    ]);
};


    let connectToSocketServer = () => {
    console.log("[RTC] Attempting to connect to socket server...");
    socketRef.current = io.connect(server_url, { secure: true });

    console.log("[RTC] Registered 'signal' event handler");
    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', () => {
        console.log("[RTC] Socket connected, id:", socketRef.current.id);
        socketRef.current.emit('join-call', { room: window.location.href, username });
        socketIdRef.current = socketRef.current.id;
        setMessages([]);
    });

    socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {
            if (connections[socketListId]) return; // Prevent duplicate connections

            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
            connections[socketListId].oniceconnectionstatechange = () => {
                console.log(`[RTC][${socketListId}] ICE state:`, connections[socketListId].iceConnectionState);
            };

            // ICE candidate
            connections[socketListId].onicecandidate = function (event) {
                if (event.candidate != null) {
                    socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                }
            };

            // Modern WebRTC: Use ontrack
            connections[socketListId].ontrack = (event) => {
                setVideos(prevVideos => {
                    if (prevVideos.some(v => v.socketId === socketListId)) return prevVideos;
                    return [...prevVideos, {
                        socketId: socketListId,
                        stream: event.streams[0],
                        autoplay: true,
                        playsinline: true
                    }];
                });
            };

            // Add local tracks
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    connections[socketListId].addTrack(track, window.localStream);
                });
            }
        });

        // Only the new user creates offers
        if (id === socketIdRef.current) {
            for (let id2 in connections) {
                if (id2 === socketIdRef.current) continue;
                connections[id2].createOffer().then((description) => {
                    connections[id2].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            }
        }
    });
};

    useEffect(() => {
    if (!socketRef.current) return;

    // Remove previous handlers to prevent duplicates
    socketRef.current.off('chat-message');
    socketRef.current.off('user-left');

    // Chat message handler
    socketRef.current.on('chat-message', (msg) => {
        console.log("CHAT MESSAGE RECEIVED", msg);
        if (msg && msg.room === window.location.href) {
            addMessage(msg.data, msg.sender, msg["socket-id-sender"]);
        }
    });

    // User left handler
    socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        if (connections[id]) {
            connections[id].close();
            delete connections[id];
        }
    });


    // Cleanup on unmount
    return () => {
        if (socketRef.current) {
            socketRef.current.off('chat-message');
            socketRef.current.off('user-left');
        }
    };
}, [addMessage]);

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
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };


    
    let connect = () => {
    setAskForUsername(false);
    console.log("[RTC] connect clicked, calling getMedia...");
    getMedia();
}



let handleVideo = async () => {
    const newVideoState = !video;
    let videoTrack = window.localStream ? window.localStream.getVideoTracks()[0] : null;

    // If turning ON and no video track, request one
    if (newVideoState && !videoTrack) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoTrack = stream.getVideoTracks()[0];

            // If no local stream, create one
            if (!window.localStream) {
                window.localStream = new MediaStream();
            }
            window.localStream.addTrack(videoTrack);

            // Update your local video element if needed
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
        } catch (e) {
            console.log("Error getting video track:", e);
            return;
        }
    }

    // Enable/disable the track
    if (videoTrack) videoTrack.enabled = newVideoState;

    // Update all peer connections
    Object.values(connections).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(newVideoState ? videoTrack : null);
        }
    });

    setVideo(newVideoState);
};








  let handleAudio = async () => {
    const newAudioState = !audio;

    let audioTrack = window.localStream ? window.localStream.getAudioTracks()[0] : null;

    // If turning ON and no audio track, request one
    if (newAudioState && !audioTrack) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTrack = stream.getAudioTracks()[0];

            // If no local stream, create one
            if (!window.localStream) {
                window.localStream = new MediaStream();
            }
            window.localStream.addTrack(audioTrack);

            // Update your local video element if needed
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
        } catch (e) {
            console.log("Error getting audio track:", e);
            return;
        }
    }

    // Enable/disable the track
    if (audioTrack) audioTrack.enabled = newAudioState;

    // Update all peer connections
    Object.values(connections).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) {
            sender.replaceTrack(newAudioState ? audioTrack : null);
        }
    });

    setAudio(newAudioState);
};






let getDislayMediaSuccess = (stream) => {
    console.log("[ScreenShare] Stream received");

    try {
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
                console.log("[ScreenShare] Stopping old track:", track.kind);
                track.stop();
            });
        }
    } catch (e) {
        console.error("[ScreenShare] Error stopping old tracks:", e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;
    console.log("[ScreenShare] localVideoref.srcObject set");

    for (let id in connections) {
        if (id === socketIdRef.current) {
            continue;
        }
        console.log(`[ScreenShare] Updating connection for peer: ${id}`);

        // Remove old tracks of type video or audio from the connection
        const senders = connections[id].getSenders();
        senders.forEach(sender => {
            if (sender.track && (sender.track.kind === 'video' || sender.track.kind === 'audio')) {
                console.log(`[ScreenShare] Removing old track (${sender.track.kind}) from connection ${id}`);
                connections[id].removeTrack(sender);
            }
        });

        // Add all tracks from new stream
        window.localStream.getTracks().forEach(track => {
            console.log(`[ScreenShare] Adding track (${track.kind}) to connection ${id}`);
            connections[id].addTrack(track, window.localStream);
        });

        connections[id].createOffer()
            .then(description => {
                console.log(`[ScreenShare] Created offer for ${id}`);
                return connections[id].setLocalDescription(description);
            })
            .then(() => {
                console.log(`[ScreenShare] Set local description and emitting signal to ${id}`);
                socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
            })
            .catch(e => console.error("[ScreenShare] Error during offer creation or signaling:", e));
    }

    stream.getTracks().forEach(track => {
        track.onended = () => {
            console.log("[ScreenShare] Screen sharing stopped by user");

            setScreen(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => {
                    console.log("[ScreenShare] Stopping track after screen share ended:", track.kind);
                    track.stop();
                });
            } catch (e) {
                console.error("[ScreenShare] Error stopping tracks after screen share ended:", e);
            }

            // Fallback to camera
            getUserMedia();
        };
    });
};

let getDisplayMedia = () => {
    if(screen) {
        if(navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .catch((e) => console.log(e));
        }
    }
};

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

                    <h2 style={{textAlign: "center" , fontSize: "40px", color: "#232526"}}>Enter into Lobby </h2>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "20px", gap: "12px"}}>
                        <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
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
                        {videos.map((video) => (
                            <video
                                key={video.socketId}
                                ref={el => {
                                    if (el) el.srcObject = video.stream;
                                }}
                                autoPlay
                                playsInline
                                id={`remoteVideo-${video.socketId}`}
                            />
                        ))}
                    </div>
                </div>
            }

        </div>
    );
}