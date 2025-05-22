/* eslint-disable no-unused-vars */
import React, { use } from 'react'
import { useState, useEffect, useRef } from 'react'
import { TextField, Button } from '@mui/material';
import "../styles/videoComponet.css"

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


    let getUserMediaSucess = ()=>{

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
        connectToSocketServer();
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
