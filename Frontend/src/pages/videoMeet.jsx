/* eslint-disable no-unused-vars */
import React, { use } from 'react'
import { useState, useEffect, useRef } from 'react'
import { TextField, Button } from '@mui/material';
import "../styles/videoComponet.css"
import { io } from 'socket.io-client';
import { connect } from 'http2';

// For Vite projects, use import.meta.env
const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL;
var connections = {};

// Session Traversal Utilities for NAT

const peerConfigConnection = {
    "iceServers": [
        {"urls" : "stun:stun.l.google.com:19302"},
    ]
};

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [video, setVideo] = useState();

    let [audioAvailable, setAudioAvailable] = useState(true);
    let [audio, setAudio] = useState();

    let [screenAvailable, setScreenAvailable] = useState();
    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState();

    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessage, setNewMessage] = useState(0);

    let [askforUserName, setAskforUserName] = useState(true);
    let [userName, setUserName] = useState("");

    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    // if(isChorme() === false) {
    //     alert("Please use Chrome browser");
    // }

     const getPermissions = async () => {
        try{
            const videoPernission = await navigator.mediaDevices.getUserMedia({video: true});

            if(videoPernission){
                setVideoAvailable(true);
            }else{
                setVideoAvailable(false);
            }

             const audioPernission = await navigator.mediaDevices.getUserMedia({ audio: true});

            if(audioAvailable){
                setAudioAvailable(true);
            }else{
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            }else{
                setScreenAvailable(false);
            }

            if(videoAvailable === true && audioAvailable === true){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        }catch(err){
            console.log("Error in getting permissions", err);
        }
     }

    useEffect(() =>{
        getPermissions();
    },[]);


    let gotMessageFromServer = () =>{

    }

    let addMessage = () => {

    }

    let getUserMediaSucess = () => {
        socketRef.current = io.connect(serverUrl, {secure: false});

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideo((videos) => {
                    let newVideos = videos.filter((video) => {
                        return video.socketId !== id;
                    });
                    return newVideos;
                })
            });

            socketRef.current.on("user-joined", (id,clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnection);
                    connections[socketListId].onicecandidate = (event) => {
                        if(event.candidate !== null){
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice' : event.candidate}));
                        }
                    }

                    connections[socketListId].onaddstream = (event) =>{
                        let videoExists = videoRef.current.find((video) => video.socketId === socketListId);
                        if(videoExists){
                            const updatedVideos = videos.map((video) => {
                                video.socketId === socketListId ? { ...video, stream: event.stream} : video;
                        });
                            videoRef.current = updatedVideos;
                            return updatedVideos
                        }else{
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true,
                            }

                            setVideos((videos) => {
                                const updatedVideos =  [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream);
                    }else{
                        // Todo blackslience
                    }
                });

                if(id === socketIdRef.current){
                    for(let id2 in connections){
                        if(id2 === socketIdRef.current){
                            continue;
                        }

                        try{
                            connections[id2].addStream(window.localStream);
                        }catch(e){
                            connections[id2].createOffer().then((description) => {
                                connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({'sdp' : connections[id2].localDescription}));
                                })
                                .catch((e) => {
                                    console.log("Error in setting local description", e);
                                });
                            })
                        }
                    }
                }
                
            });

        });
    }

    let getUserMedia = async () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSucess)
            .then((stream)=> {})
            .catch((err)=>console.log(err));
        }else{
            try{
                let track = localVideoRef.current.srcObject.getTracks();
                track.forEach((t) => {
                    t.stop();
                });
            }catch(e){
                console.log("Error in stopping the stream", e);
            }
        }
    }

    useEffect(() => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    },[video, audio]);

    let getMedia = () =>{
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        // connectToSocketServer();
    }

     let connect = () => {
        setAskforUserName(false);
        getMedia();
    }

  return (
    <div>
        {askforUserName === true ? 
            <div>
                <h2>Enter into lobby</h2>
                <TextField id="outlined-basic" label="UserName" value={userName} onChange={e => setUserName(e.target.value)} variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>

                <div>
                    <video ref={localVideoRef} muted autoPlay></video>
                </div>
            </div>
            
            : 
            <div></div>
        }
    </div>
  )
}
