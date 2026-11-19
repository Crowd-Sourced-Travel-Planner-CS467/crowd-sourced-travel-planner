import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import App from './App.jsx'
import Trips from './trips.jsx'
import ExperienceForm from './pages/ExperienceForm.jsx'
import ExperienceView from './pages/ExperienceView.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Registration from './pages/Registration.jsx'
import Register from "./pages/Register.jsx"
import AccountManagement from './pages/AccountManagement.jsx'

import ExperienceSearch from './pages/ExperienceSearch.jsx'
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import History from "./pages/History.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/trip-management" element={<Trips />} />
        <Route path="/experiences/new" element={<ExperienceForm />} />
        <Route path="/experiences/:experienceId" element={<ExperienceView />} />
        <Route path="/experiences" element={<ExperienceSearch />} />

        {/* User Management */}
        <Route path="/login" element={<Login />} />
    
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<AccountManagement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)