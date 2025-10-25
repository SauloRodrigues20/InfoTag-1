import { Routes, Route } from 'react-router-dom'
import PortalPaciente from './PortalPaciente' // Vamos criar este arquivo
import './App.css' // Pode customizar o CSS aqui

function App() {
  return (
    <Routes>
      {/* Esta é a rota que a tag NFC vai chamar */}
      <Route path="/portal/:userId" element={<PortalPaciente />} />

      {/* Rota para o futuro dashboard */}
      {/* <Route path="/admin" element={<h1>Dashboard Admin</h1>} /> */}
    </Routes>
  )
}
export default App