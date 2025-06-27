// Script para limpar dados de teste problemáticos no SeaLogistics
// Execute com: node cleanup-test-data.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Configuração do Firebase (usar a mesma do projeto)
const firebaseConfig = {
    // Cole aqui sua configuração do Firebase
    // Você pode encontrar isso no console do Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupTestData() {
    try {
        console.log('🧹 Limpando dados de teste problemáticos...\n');

        // Listar todos os usuários
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let deletedCount = 0;

        console.log(`📋 Encontrados ${usersSnapshot.docs.length} usuários para verificar...`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Verificar se há campos undefined ou dados problemáticos
            const hasUndefinedFields = Object.values(userData).some(value => value === undefined);
            const isTestUser = userId.startsWith('user_') && !userData.displayName;

            if (hasUndefinedFields || isTestUser) {
                console.log(`🗑️  Removendo usuário problemático: ${userId}`);
                console.log(`   - Email: ${userData.email || 'N/A'}`);
                console.log(`   - Nome: ${userData.displayName || 'N/A'}`);
                console.log(`   - Problemas: ${hasUndefinedFields ? 'Campos undefined' : ''} ${isTestUser ? 'Dados de teste incompletos' : ''}`);

                await deleteDoc(doc(db, 'users', userId));
                deletedCount++;
            }
        }

        // Limpar shipments sem empresa definida corretamente
        const shipmentsSnapshot = await getDocs(collection(db, 'shipments'));
        let shipmentsDeleted = 0;

        console.log(`\n📦 Encontrados ${shipmentsSnapshot.docs.length} shipments para verificar...`);

        for (const shipmentDoc of shipmentsSnapshot.docs) {
            const shipmentData = shipmentDoc.data();
            const shipmentId = shipmentDoc.id;

            // Verificar se há campos undefined
            const hasUndefinedFields = Object.values(shipmentData).some(value => value === undefined);

            if (hasUndefinedFields) {
                console.log(`🗑️  Removendo shipment problemático: ${shipmentId}`);
                console.log(`   - BL: ${shipmentData.numeroBl || 'N/A'}`);
                console.log(`   - Cliente: ${shipmentData.cliente || 'N/A'}`);

                await deleteDoc(doc(db, 'shipments', shipmentId));
                shipmentsDeleted++;
            }
        }

        console.log('\n✅ Limpeza concluída!');
        console.log(`   - Usuários removidos: ${deletedCount}`);
        console.log(`   - Shipments removidos: ${shipmentsDeleted}`);

        if (deletedCount === 0 && shipmentsDeleted === 0) {
            console.log('🎉 Nenhum dado problemático encontrado!');
        } else {
            console.log('\n💡 Recomendação: Execute o script create-test-data.js para recriar dados limpos.');
        }

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
    }
}

// Executar apenas se este arquivo for chamado diretamente
if (require.main === module) {
    cleanupTestData().then(() => {
        console.log('\n✨ Script de limpeza concluído!');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { cleanupTestData }; 