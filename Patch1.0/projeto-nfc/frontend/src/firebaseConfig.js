import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Cole o objeto firebaseConfig que você copiou do console
const firebaseConfig = {
  apiKey: "AIzaSyDo4b3r15Vlxp1joRd31GBsB7hIaWZmr0c",
  authDomain: "info-tag.firebaseapp.com",
  projectId: "info-tag",
  storageBucket: "info-tag.firebasestorage.app",
  messagingSenderId: "34901577805",
  appId: "1:34901577805:web:da2d72e0deceb8aa308c04"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação para usarmos em outros arquivos
export const auth = getAuth(app);