import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import LandingPage from './pages/landing'
import './App.css'
import Authentication from './pages/authentication.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import VideoMeetComponent from './pages/videoMeet'
import HomeComponent from './pages/home.jsx'

function App() {
  
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/:url" element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
