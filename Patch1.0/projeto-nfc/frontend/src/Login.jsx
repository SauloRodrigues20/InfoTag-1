import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebaseConfig'; // Importamos nosso auth

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook para redirecionar após o login

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Função mágica do Firebase que faz o login
      await signInWithEmailAndPassword(auth, email, password);
      
      // Se o login for bem-sucedido, redireciona para o dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('E-mail ou senha inválidos.');
    }
  };

  return (
    <div className="container">
      <h2>Login do Administrador</h2>
      <form onSubmit={handleLogin}>
        <div style={{ margin: '10px' }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ margin: '10px' }}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Entrar</button>
        {error && <p className="erro-pin">{error}</p>}
      </form>
    </div>
  );
}

export default Login;