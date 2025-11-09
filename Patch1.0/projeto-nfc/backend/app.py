import firebase_admin
from firebase_admin import credentials, firestore, auth # 1. ADICIONE 'auth'
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt

# --- 1. Configuração Inicial ---

# Inicializa o Flask
app = Flask(__name__)

# Configura o CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# Inicializa o Firebase Admin
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client() # Nosso objeto de banco de dados

# --- 2. Rotas Públicas (Portal do Paciente) ---

@app.route('/api/public-info/<string:user_id>', methods=['GET'])
def get_public_info(user_id):
    """
    Esta rota é pública. Ela só retorna o nome e o contato de emergência.
    """
    try:
        user_ref = db.collection('usuarios').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Pega SÓ as informações públicas
        user_data = user_doc.to_dict()
        public_info = user_data.get('infoPublica', {})
        return jsonify(public_info), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/unlock', methods=['POST'])
def unlock_data():
    """
    Esta rota é segura. Ela recebe um JSON com o ID e o PIN,
    verifica se o PIN está correto e SÓ ENTÃO retorna os dados privados.
    """
    try:
        data = request.get_json()
        user_id = data.get('userId')
        pin_fornecido = data.get('pin') # Ex: "1234"

        if not user_id or not pin_fornecido:
            return jsonify({'success': False, 'error': 'Faltando dados'}), 400

        # 1. Busca o usuário no banco
        user_ref = db.collection('usuarios').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

        user_data = user_doc.to_dict()

        # 2. Pega o HASH do PIN que está salvo no banco
        pin_hash_armazenado = user_data.get('seguranca', {}).get('pinHash')
        if not pin_hash_armazenado:
             return jsonify({'success': False, 'error': 'Usuário sem PIN'}), 500

        # 3. Compara o PIN fornecido com o HASH do banco
        if bcrypt.checkpw(pin_fornecido.encode('utf-8'), pin_hash_armazenado.encode('utf-8')):
            # SUCESSO! O PIN ESTÁ CORRETO.
            private_data = user_data.get('infoPrivada', {})
            return jsonify({'success': True, 'data': private_data}), 200
        else:
            # FALHA! O PIN ESTÁ INCORRETO.
            return jsonify({'success': False, 'error': 'PIN inválido'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- 3. Rotas do Dashboard (Seguras) ---

# Função helper para verificar o token do Firebase
def check_auth(request):
    """Verifica o token de autenticação do Firebase no header."""
    try:
        # Pega o "Bearer token" enviado pelo React
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None # Nenhum token enviado
        
        id_token = auth_header.split('Bearer ')[1]
        
        # Verifica se o token é válido e decodifica
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token # Sucesso! Retorna os dados do admin
    except Exception as e:
        print(f"Erro de autenticação: {e}")
        return None # Token inválido ou expirado

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """
    Busca todos os usuários no Firestore, mas SÓ SE o admin estiver logado.
    """
    
    # 1. Verifica se o usuário que fez a requisição está autenticado
    admin_user = check_auth(request)
    if not admin_user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    # 2. Se estiver autorizado, busca os dados
    try:
        users_ref = db.collection('usuarios')
        users_docs = users_ref.stream() # .stream() é para listas

        users_list = []
        for doc in users_docs:
            user_data = doc.to_dict()
            # Adiciona o ID do documento (importante!) aos dados
            user_data['id'] = doc.id 
            users_list.append(user_data)
        
        return jsonify(users_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- 4. Roda o servidor ---
if __name__ == '__main__':
    # Roda o app na porta 5000, em modo de debug (mostra erros)
    app.run(debug=True, port=5000)