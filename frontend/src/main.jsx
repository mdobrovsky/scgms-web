import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
// import './index.css'
import "bootstrap-icons/font/bootstrap-icons.css";
import MainPage from "./pages/MainPage.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import {ToastContainer} from "react-toastify";

/**
 * main.js
 *
 * Entry point of the React application. Sets up and renders the root component (MainPage)
 */

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ToastContainer position="top-center" theme="light" autoClose={3000}/>
        <MainPage/>
    </StrictMode>,
)
