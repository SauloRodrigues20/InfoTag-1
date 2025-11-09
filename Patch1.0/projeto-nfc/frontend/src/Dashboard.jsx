import React, { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import { auth } from './firebaseConfig'; // Importamos nosso auth
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <-- Importa o axios

// URL do nosso backend
const API_URL = 'http://127.0.0.1:5000/api';

function Dashboard() {
  const navigate = useNavigate();
  
  // Estados para guardar os dados, carregamento e erros
  const [users, setUsers] = useState([]); // Começa como uma lista vazia
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hook useEffect: Roda 1 vez quando o componente é carregado
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 1. Pega o usuário logado atualmente
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("Nenhum usuário logado");
        }
        
        // 2. Pega o "ID Token" dele (o passaporte de autenticação)
        const token = await currentUser.getIdToken();

        // 3. Faz a chamada para a API segura do Flask
        // --- CORREÇÃO APLICADA AQUI ---
        const res = await axios.get(`${API_URL}/admin/users`, { // Estava 'APIURL'
          headers: {
            'Authorization': `Bearer ${token}` // Envia o token!
          }
        });
        
        setUsers(res.data); // Salva a lista de usuários no estado

      } catch (err) {
        console.error(err);
        setError('Erro ao buscar usuários. ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []); // O array vazio [] significa "só rode na primeira vez"

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redireciona para o login após sair
    } catch (err) {
      console.error(err);
    }
  };

  // Funções de renderização
  const renderContent = () => {
    if (loading) {
      return <p>Carregando usuários...</p>;
    }
    if (error) {
      return <p className="erro-pin">{error}</p>;
    }
    if (users.length === 0) {
      return <p>Nenhum usuário encontrado na coleção 'usuarios'.</p>;
    }

    // Se tivermos usuários, mostramos a lista
    return (
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '8px' }}>Nome</th>
            <th style={{ padding: '8px' }}>ID (para NFC)</th>
            <th style={{ padding: '8px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #555' }}>
              <td style={{ padding: '8px' }}>{user.infoPublica?.nome || 'Sem nome'}</td>
              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{user.id}</td>
              <td style={{ padding: '8px' }}>
                <button style={{ marginRight: '5px' }}>Editar</button>
                <button style={{ backgroundColor: '#aa2222' }}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard Admin</h2>
        <button onClick={handleLogout} style={{ backgroundColor: 'darkred', color: 'white' }}>
          Sair
        </button>
      </div>
      <p>Gerencie todos os usuários cadastrados.</p>
      
      <hr />
      
      {/* Botão para criar novo usuário (próxima etapa) */}
      <button style={{ backgroundColor: 'green', color: 'white', marginBottom: '20px' }}>
        + Adicionar Novo Usuário
      </button>

      {/* Renderiza o conteúdo (lista, loading ou erro) */}
      {renderContent()}
    </div>
  );
}

export default Dashboard;