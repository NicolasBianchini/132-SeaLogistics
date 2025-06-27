// Script para forçar login como admin
// Execute no console do navegador

console.log('🔧 Forçando login como admin...');

// Limpar localStorage
localStorage.clear();
console.log('✅ LocalStorage limpo');

// Definir dados do admin
const adminUser = {
    email: "teste@gmail.com",
    name: "teste teste",
    id: "user_1750952421306",
    role: "admin"
};

// Salvar no localStorage
localStorage.setItem('currentUser', JSON.stringify(adminUser));
console.log('✅ Dados de admin salvos:', adminUser);

// Recarregar página
window.location.reload(); 