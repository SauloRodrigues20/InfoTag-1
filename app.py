# Importações necessárias
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

# Cria a aplicação web
app = Flask(__name__)

# Configurações
# Chave secreta para proteger as sessões e mensagens flash
app.config['SECRET_KEY'] = os.urandom(24) 
# Caminho para o banco de dados SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'

# Inicializa o banco de dados com a nossa aplicação
db = SQLAlchemy(app)

# --- MODELOS DO BANCO DE DADOS ---
# Define a estrutura da tabela de Usuários
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

# --- ROTAS DA APLICAÇÃO ---
@app.route('/')
def index():
    return render_template('index.html')

# Rota para o painel (vamos criar em breve)
@app.route('/dashboard')
def dashboard():
    # Proteção: só permite acesso se o usuário estiver logado
    if 'user_id' not in session:
        flash('Por favor, faça login para acessar esta página.', 'warning')
        return redirect(url_for('login'))
    
    # Busca o usuário no banco de dados para exibir informações
    user = db.session.get(User, session['user_id'])
    return f"<h1>Olá, {user.username}!</h1><p>Você está no seu painel.</p><a href='/logout'>Sair</a>"

# Rota de Cadastro
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Pega os dados do formulário
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Cria um hash seguro da senha
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        # Cria um novo usuário
        new_user = User(username=username, email=email, password_hash=hashed_password)
        
        # Adiciona ao banco de dados
        db.session.add(new_user)
        db.session.commit()
        
        flash('Sua conta foi criada com sucesso! Faça o login.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

# Rota de Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # Procura o usuário pelo e-mail
        user = User.query.filter_by(email=email).first()
        
        # Verifica se o usuário existe e se a senha está correta
        if user and check_password_hash(user.password_hash, password):
            # Armazena o ID do usuário na sessão
            session['user_id'] = user.id
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Login falhou. Verifique seu e-mail e senha.', 'danger')
            
    return render_template('login.html')

# Rota de Logout
@app.route('/logout')
def logout():
    # Remove o ID do usuário da sessão
    session.pop('user_id', None)
    flash('Você saiu da sua conta.', 'info')
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True) 