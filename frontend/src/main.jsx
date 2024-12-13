import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.jsx'
import FiltersPage from "./FiltersPage.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FiltersPage />
  </StrictMode>,
)
