import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App.jsx'
import './index.css'
import { AuthProvider } from "./context/AuthContext.jsx"
import { FeedbackProvider } from "./context/FeedbackContext.jsx"

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <FeedbackProvider>
                    <App />
                </FeedbackProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)
