import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Pega o ID da URL
import axios from 'axios'; // Para chamar nossa API Flask

// Define a URL da nossa API.
// O React roda na porta 5173, o Flask na 5000.
const API_URL = 'http://127.0.0.1:5000/api';

function PortalPaciente() {
  // 1. Estados
  const { userId } = useParams(); // Pega o ID da URL (ex: 7aLpQcR2bX...)

  const [infoPublica, setInfoPublica] = useState(null);
  const [dadosPrivados, setDadosPrivados] = useState(null);

  const [pin, setPin] = useState('');
  const [estaBloqueado, setEstaBloqueado] = useState(true);
  const [erro, setErro] = useState(''); // Para mensagens de erro

  // 2. Efeito de Carregamento (Busca dados públicos)
  useEffect(() => {
    // Esta função roda assim que o componente é carregado
    const fetchPublicInfo = async () => {
      try {
        setErro('');
        // Chama a rota pública do Flask
        const res = await axios.get(`${API_URL}/public-info/${userId}`);
        setInfoPublica(res.data);
      } catch (err) {
        setErro('Erro: Usuário não encontrado ou API offline.');
        console.error(err);
      }
    };

    fetchPublicInfo();
  }, [userId]); // Roda de novo se o userId mudar

  // 3. Funções de Ação
  const handleLigarEmergencia = () => {
    if (infoPublica && infoPublica.contatoEmergencia) {
      // Isso tenta abrir o discador do celular
      window.location.href = `tel:${infoPublica.contatoEmergencia}`;
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault(); // Impede o formulário de recarregar a página
    setErro('');

    try {
      // Chama a rota segura de 'unlock' do Flask
      const res = await axios.post(`${API_URL}/unlock`, {
        userId: userId,
        pin: pin
      });

      // O Flask responde com { success: true, data: {...} }
      if (res.data.success) {
        setDadosPrivados(res.data.data);
        setEstaBloqueado(false); // Desbloqueia!
      }
    } catch (err) {
      // O Flask responde com 401 (PIN inválido)
      setErro('PIN inválido. Tente novamente.');
      console.error(err);
    }
  };

  // 4. Renderização (O que aparece na tela)

  // Se estiver carregando (infoPublica ainda é null)
  if (!infoPublica && !erro) {
    return <div className="container">Carregando...</div>;
  }

  // Se deu um erro grave (usuário não existe)
  if (erro && !infoPublica) {
    return <div className="container erro">{erro}</div>;
  }

  // --- Tela Principal (Bloqueada ou Desbloqueada) ---
  return (
    <div className="container">
      {/* Mostra o nome do paciente (dado público) */}
      <h2>{infoPublica.nome}</h2>
      <hr />

      {/* Botão de Emergência (sempre visível) */}
      <button className="btn-emergencia" onClick={handleLigarEmergencia}>
        Ligar para Contato de Emergência
      </button>

      {/* --- Divisão: Bloqueado vs Desbloqueado --- */}

      {estaBloqueado ? (
        // 4a. Se estiver BLOQUEADO, mostra o formulário de PIN
        <div className="bloqueado">
          <h3>Acesso Restrito</h3>
          <p>Insira o PIN para ver as informações médicas.</p>
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              maxLength="6"
              autoFocus
            />
            <button type="submit">Desbloquear</button>
          </form>
          {/* Mostra erro de PIN (se houver) */}
          {erro && <p className="erro-pin">{erro}</p>}
        </div>

      ) : (
        // 4b. Se estiver DESBLOQUEADO, mostra os dados privados
        <div className="desbloqueado">
          <h3>Informações Médicas</h3>
          <div className="info-grid">
            <p><strong>Tipo Sanguíneo:</strong> {dadosPrivados.tipoSanguineo}</p>
            <p><strong>Alergias:</strong> {dadosPrivados.alergias}</p>
            {/* Adicione mais campos aqui conforme sua struct no Firebase */}
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalPaciente;