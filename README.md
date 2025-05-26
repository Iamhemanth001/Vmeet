🎥 VideoMeet

Where Faces Meet, No Matter the Place!

VideoMeet is a real-time video chat application that uses WebRTC for peer-to-peer media connections, 
Socket.io for signaling, and Web APIs like navigator.mediaDevices.getUserMedia to access camera and microphone.

-------------------------------------

🚀 Features

      -> Peer-to-peer video and audio communication using WebRTC
      
      -> Real-time signaling with Socket.io
      
      -> Room-based connection joining
      
      -> Camera and microphone access with browser APIs
      
      -> STUN servers to retrieve public IP and ports

---------------------------------------

🛠️ Tech Stack

      -> Frontend: React (Vite), JavaScript, WebRTC
   
      -> Backend: Node.js, Express, Socket.io
      
      -> STUN Servers: Google STUN or other public STUN servers
      
      -> Signaling: Socket.io (for exchanging offer/answer/ICE)

-------------------
📹 How It Works

   1. User enters a room.

   2. Socket.io handles the signaling phase (exchange of offers, answers, and ICE candidates).

   3. WebRTC establishes a Peer-to-Peer connection.

   4. Users can share audio, video, and screen directly.

-------------------------
📦 Installation

1. Clone the repository
   
   `git clone https://github.com/Iamhemanth001/VideoMeet.git
    cd VideoMeet
   `

2. Backend Setup

     `# Navigate to backend
      cd Backend
     `
  
     `# Install dependencies
     npm install
     `
     
     `# Start the backend server
     npm run dev
     `
  
3. Frontend Setup

     `# Navigate to frontend
     cd ../Frontend
     `
     
    `# Install dependencies
     npm install
     `
     
     `# Start the backend server
     npm run dev
     `
   
-------------------   
🙋‍♂️ Author

Your Name – @Iamhemanth001

Made with 💙 and WebRTC magic
