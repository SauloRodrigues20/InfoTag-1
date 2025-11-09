import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebaseConfig';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta função do Firebase "escuta" o estado do login
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpa o "escutador" quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Mostra "Carregando..." enquanto o Firebase verifica se há um usuário logado
    return <div className="container">Verificando autenticação...</div>;
  }

  if (!user) {
    // Se não há usuário logado, redireciona para a página de login
    return <Navigate to="/login" />;
  }

  // Se há um usuário logado, permite ver a página (children)
  return children;
}

export default ProtectedRoute;