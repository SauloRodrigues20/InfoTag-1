import { Routes, Route } from 'react-router-dom'
import PortalPaciente from './PortalPaciente' 
import './App.css' 
import Login from './Login';
import Dashboard from './Dashboard';
import ProtectedRoute from './ProtectedRoute'; // <-- Importe o Porteiro

function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/portal/:userId" element={<PortalPaciente />} />
      <Route path="/login" element={<Login />} />

      {/* Rota Privada */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}
export default App