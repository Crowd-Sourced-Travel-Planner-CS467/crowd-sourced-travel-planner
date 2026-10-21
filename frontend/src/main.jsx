
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Trips from './trips.jsx'
import ExperienceForm from "./pages/ExperienceForm.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/trip-management" element={<Trips />} />
        <Route path="/experiences/new" element={<ExperienceForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

