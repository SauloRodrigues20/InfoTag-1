import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Pega o ID da URL
import axios from 'axios'; // Para chamar nossa API Flask

// Define a URL da nossa API.
const API_URL = 'http://127.0.0.1:5000/api';

function PortalPaciente() {
  // 1. Estados
  const { userId } = useParams(); // Pega o ID da URL

  const [infoPublica, setInfoPublica] = useState(null);
  const [dadosPrivados, setDadosPrivados] = useState(null); // Agora vai conter tudo o que é privado

  const [pin, setPin] = useState('');
  const [estaBloqueado, setEstaBloqueado] = useState(true);
  const [erro, setErro] = useState(''); // Para mensagens de erro

  // 2. Efeito de Carregamento (Busca dados públicos - agora, SÓ O NOME)
  useEffect(() => {
    // Esta função roda assim que o componente é carregado
    const fetchPublicInfo = async () => {
      try {
        setErro('');
        // Chama a rota pública do Flask
        const res = await axios.get(`${API_URL}/public-info/${userId}`);
        setInfoPublica(res.data); // 'res.data' agora contém apenas { nome: "..." }
      } catch (err) {
        setErro('Erro: Usuário não encontrado ou API offline.');
        console.error(err);
      }
    };

    fetchPublicInfo();
  }, [userId]); // Roda de novo se o userId mudar

  // 3. Funções de Ação
  
  // Função para Ligar (agora usa 'dadosPrivados')
  const handleLigarEmergencia = () => {
    // Verifica se 'dadosPrivados' existe antes de tentar ler
    if (dadosPrivados && dadosPrivados.contatoEmergencia) {
      window.location.href = `tel:${dadosPrivados.contatoEmergencia}`;
    }
  };

  // Função de Desbloqueio
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

  // Função para bloquear a tela novamente
  const handleLock = () => {
    setEstaBloqueado(true); // Volta ao estado bloqueado
    setPin('');             // Limpa o PIN digitado
    setErro('');            // Limpa mensagens de erro
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
      {/* Mostra o nome do paciente (dado público - sempre visível) */}
      <h2>{infoPublica.nome}</h2>
      <hr />

      {/* --- Divisão: Bloqueado vs Desbloqueado --- */}
      
      {estaBloqueado ? (
        // 4a. Se estiver BLOQUEADO, mostra SÓ o formulário de PIN
        <div className="bloqueado">
          <h3>Acesso Restrito</h3>
          <p>Insira o PIN para ver as informações.</p>
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
        // 4b. Se estiver DESBLOQUEADO, mostra TUDO
        <div className="desbloqueado">
          
          {/* Botão de Emergência (Só aparece se 'dadosPrivADOS' existir) */}
          {dadosPrivados && (
            <button className="btn-emergencia" onClick={handleLigarEmergencia}>
              Ligar para Contato de Emergência
            </button>
          )}

          <h3>Informações Médicas</h3>

          {/* --- CORREÇÃO DA TELA EM BRANCO ---
            Verificamos se 'dadosPrivados' não é nulo ANTES de tentar ler
            as propriedades dele (como tipoSanguineo, alergias, etc.)
          */}
          {dadosPrivados ? (
            <div className="info-grid">
              
              {/* Campos de string simples */}
              <p><strong>Tipo Sanguíneo:</strong> {dadosPrivados.tipoSanguineo || 'Não informado'}</p>
              <p><strong>Histórico Médico:</strong> {dadosPrivados.historico || 'Não informado'}</p>

              {/* Campo de Array: Alergias */}
              <div className="lista-itens">
                <strong>Alergias:</strong>
                {dadosPrivados.alergias && dadosPrivados.alergias.length > 0 ? (
                  <ul>
                    {dadosPrivados.alergias.map((alergia, index) => (
                      <li key={index}>{alergia}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhuma alergia registrada.</p>
                )}
              </div>

              {/* Campo de Array: Medicamentos */}
              <div className="lista-itens">
                <strong>Medicamentos:</strong>
                {dadosPrivados.medicamentosUsoContinuo && dadosPrivados.medicamentosUsoContinuo.length > 0 ? (
                  <ul>
                    {dadosPrivados.medicamentosUsoContinuo.map((medicamento, index) => (
                      <li key={index}>{medicamento}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum medicamento registrado.</p>
                )}
              </div>
              
            </div>
          ) : (
            // Se 'dadosPrivados' for nulo por um instante, mostre isso
            <p>Carregando informações...</p>
          )}

          {/* --- Botão de Bloquear Tela --- */}
          <hr />
          <button className="btn-bloquear" onClick={handleLock}>
            Bloquear Tela
          </button>
          
        </div>
      )}
    </div>
  );
}

export default PortalPaciente;