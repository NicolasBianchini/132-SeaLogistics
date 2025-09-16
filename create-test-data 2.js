// Script para criar dados de teste no SeaLogistics
// Execute com: node create-test-data.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Configuração do Firebase (substituir pelos seus dados)
const firebaseConfig = {
    // Cole aqui sua configuração do Firebase
    // Você pode encontrar isso no console do Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados de teste
const testCompanies = [
    {
        id: 'company_001',
        name: 'Logistics Express LTDA',
        code: 'LOG001',
        contactEmail: 'contato@logisticsexpress.com',
        phone: '(11) 1234-5678',
        address: 'Rua das Empresas, 123 - São Paulo, SP',
        isActive: true,
        createdAt: new Date()
    },
    {
        id: 'company_002',
        name: 'MarítimaCargo S.A.',
        code: 'MAR002',
        contactEmail: 'admin@maritimacargo.com',
        phone: '(21) 8765-4321',
        address: 'Av. Portuária, 456 - Rio de Janeiro, RJ',
        isActive: true,
        createdAt: new Date()
    },
    {
        id: 'company_003',
        name: 'Global Shipping Co.',
        code: 'GLB003',
        contactEmail: 'info@globalshipping.com',
        phone: '(11) 5555-0000',
        address: 'Rua Internacional, 789 - Santos, SP',
        isActive: false, // Empresa inativa para teste
        createdAt: new Date()
    }
];

const testUsers = [
    // Admin
    {
        uid: 'admin_001',
        email: 'admin@sealogistics.com',
        displayName: 'Administrador Sistema',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
    },
    // Usuários de empresa
    {
        uid: 'user_001',
        email: 'carlos@logisticsexpress.com',
        displayName: 'Carlos Silva',
        role: 'company_user',
        companyId: 'company_001',
        companyName: 'Logistics Express LTDA',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
    },
    {
        uid: 'user_002',
        email: 'maria@logisticsexpress.com',
        displayName: 'Maria Santos',
        role: 'company_user',
        companyId: 'company_001',
        companyName: 'Logistics Express LTDA',
        isActive: true,
        createdAt: new Date()
    },
    {
        uid: 'user_003',
        email: 'joao@maritimacargo.com',
        displayName: 'João Oliveira',
        role: 'company_user',
        companyId: 'company_002',
        companyName: 'MarítimaCargo S.A.',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
    },
    {
        uid: 'user_004',
        email: 'ana@globalshipping.com',
        displayName: 'Ana Costa',
        role: 'company_user',
        companyId: 'company_003',
        companyName: 'Global Shipping Co.',
        isActive: false, // Usuário inativo para teste
        createdAt: new Date()
    }
];

const testShipments = [
    {
        cliente: 'ABC Importadora',
        operador: 'Carlos Silva',
        pol: 'Shanghai',
        pod: 'Santos',
        etdOrigem: '2024-01-15',
        etaDestino: '2024-02-20',
        quantBox: 40,
        status: 'Em Trânsito',
        numeroBl: 'SHA2024001',
        armador: 'COSCO Shipping',
        booking: 'COS240115001',
        companyId: 'company_001',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
    },
    {
        cliente: 'XYZ Electronics',
        operador: 'Maria Santos',
        pol: 'Hamburg',
        pod: 'Rio Grande',
        etdOrigem: '2024-01-20',
        etaDestino: '2024-02-25',
        quantBox: 25,
        status: 'Documentação',
        numeroBl: 'HAM2024002',
        armador: 'Hapag-Lloyd',
        booking: 'HAP240120001',
        companyId: 'company_001',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-19')
    },
    {
        cliente: 'Indústria Têxtil BR',
        operador: 'João Oliveira',
        pol: 'Busan',
        pod: 'Paranaguá',
        etdOrigem: '2024-01-25',
        etaDestino: '2024-03-05',
        quantBox: 60,
        status: 'Carregado',
        numeroBl: 'BUS2024003',
        armador: 'Evergreen',
        booking: 'EVR240125001',
        companyId: 'company_002',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-24')
    },
    {
        cliente: 'Auto Parts Plus',
        operador: 'João Oliveira',
        pol: 'Long Beach',
        pod: 'Itajaí',
        etdOrigem: '2024-02-01',
        etaDestino: '2024-03-10',
        quantBox: 35,
        status: 'Planejado',
        numeroBl: 'LGB2024004',
        armador: 'MSC',
        booking: 'MSC240201001',
        companyId: 'company_002',
        createdAt: new Date('2024-01-28'),
        updatedAt: new Date('2024-01-30')
    }
];

async function createTestData() {
    try {
        console.log('🚀 Criando dados de teste para SeaLogistics...\n');

        // Criar empresas
        console.log('📦 Criando empresas...');
        for (const company of testCompanies) {
            await setDoc(doc(db, 'companies', company.id), company);
            console.log(`✅ Empresa criada: ${company.name} (${company.code})`);
        }

        // Criar usuários
        console.log('\n👥 Criando usuários...');
        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid), user);
            console.log(`✅ Usuário criado: ${user.displayName} (${user.role})`);
        }

        // Criar shipments
        console.log('\n🚢 Criando shipments...');
        for (let i = 0; i < testShipments.length; i++) {
            const shipmentId = `shipment_${String(i + 1).padStart(3, '0')}`;
            await setDoc(doc(db, 'shipments', shipmentId), testShipments[i]);
            console.log(`✅ Shipment criado: ${testShipments[i].numeroBl} (${testShipments[i].status})`);
        }

        console.log('\n🎉 Dados de teste criados com sucesso!');
        console.log('\n📋 Credenciais de teste:');
        console.log('='.repeat(50));
        console.log('🔑 ADMIN:');
        console.log('   Email: admin@sealogistics.com');
        console.log('   Senha: (qualquer senha - auth simulada)');
        console.log('\n🏢 USUÁRIOS DE EMPRESA:');
        console.log('   Email: carlos@logisticsexpress.com');
        console.log('   Email: maria@logisticsexpress.com');
        console.log('   Email: joao@maritimacargo.com');
        console.log('   Senha: (qualquer senha - auth simulada)');
        console.log('\n💡 Nota: A autenticação está simulada para desenvolvimento.');
        console.log('   Para produção, implemente Firebase Auth real.');

    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error);
    }
}

// Executar apenas se este arquivo for chamado diretamente
if (require.main === module) {
    createTestData().then(() => {
        console.log('\n✨ Script concluído!');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { createTestData, testCompanies, testUsers, testShipments }; 