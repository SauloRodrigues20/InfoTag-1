import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt

# --- 1. Configuração Inicial ---

# Inicializa o Flask
app = Flask(__name__)

# Configura o CORS para permitir que o React (que rodará em localhost:5173) 
# acesse esta API (que rodará em localhost:5000).
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# Inicializa o Firebase Admin
cred = credentials.Certificate('serviceAccountKey.json') 
firebase_admin.initialize_app(cred)
db = firestore.client() # Nosso objeto de banco de dados

# --- 2. Nossas Rotas (Endpoints) ---

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
        # (Precisamos converter para 'bytes' para o bcrypt funcionar)
        if bcrypt.checkpw(pin_fornecido.encode('utf-8'), pin_hash_armazenado.encode('utf-8')):
            # SUCESSO! O PIN ESTÁ CORRETO.
            private_data = user_data.get('infoPrivada', {})
            return jsonify({'success': True, 'data': private_data}), 200
        else:
            # FALHA! O PIN ESTÁ INCORRETO.
            return jsonify({'success': False, 'error': 'PIN inválido'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- 3. Roda o servidor ---
if __name__ == '__main__':
    # Roda o app na porta 5000, em modo de debug (mostra erros)
    app.run(debug=True, port=5000)