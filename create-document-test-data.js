import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "sealogistics-4f899.firebaseapp.com",
    projectId: "sealogistics-4f899",
    storageBucket: "sealogistics-4f899.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados de teste para documentos
const testDocuments = [
    {
        shipmentId: "shipment1", // Substitua por IDs reais de shipments
        fileName: "BL_CSC4531060P200.pdf",
        originalName: "BL_CSC4531060P200.pdf",
        fileType: "application/pdf",
        fileSize: 245760, // 240KB
        documentType: "bill_of_lading",
        uploadedBy: "admin@sealogistics.com",
        downloadUrl: "https://storage.googleapis.com/sealogistics-docs/shipment1/BL_CSC4531060P200.pdf",
        isActive: true
    },
    {
        shipmentId: "shipment1",
        fileName: "Invoice_INV001.pdf",
        originalName: "Invoice_INV001.pdf",
        fileType: "application/pdf",
        fileSize: 153600, // 150KB
        documentType: "invoice",
        uploadedBy: "admin@sealogistics.com",
        downloadUrl: "https://storage.googleapis.com/sealogistics-docs/shipment1/Invoice_INV001.pdf",
        isActive: true
    },
    {
        shipmentId: "shipment1",
        fileName: "Packing_List_PL001.pdf",
        originalName: "Packing_List_PL001.pdf",
        fileType: "application/pdf",
        fileSize: 102400, // 100KB
        documentType: "packing_list",
        uploadedBy: "admin@sealogistics.com",
        downloadUrl: "https://storage.googleapis.com/sealogistics-docs/shipment1/Packing_List_PL001.pdf",
        isActive: true
    },
    {
        shipmentId: "shipment2",
        fileName: "BL_CSC4531061P200.pdf",
        originalName: "BL_CSC4531061P200.pdf",
        fileType: "application/pdf",
        fileSize: 307200, // 300KB
        documentType: "bill_of_lading",
        uploadedBy: "admin@sealogistics.com",
        downloadUrl: "https://storage.googleapis.com/sealogistics-docs/shipment2/BL_CSC4531061P200.pdf",
        isActive: true
    },
    {
        shipmentId: "shipment2",
        fileName: "Commercial_Invoice_CI001.pdf",
        originalName: "Commercial_Invoice_CI001.pdf",
        fileType: "application/pdf",
        fileSize: 204800, // 200KB
        documentType: "commercial_invoice",
        uploadedBy: "admin@sealogistics.com",
        downloadUrl: "https://storage.googleapis.com/sealogistics-docs/shipment2/Commercial_Invoice_CI001.pdf",
        isActive: true
    }
];

// Função para criar documentos de teste
async function createTestDocuments() {
    try {
        console.log('🚀 Criando documentos de teste...');

        for (const docData of testDocuments) {
            const docRef = await addDoc(collection(db, 'documents'), {
                ...docData,
                uploadedAt: new Date()
            });
            console.log(`✅ Documento criado com ID: ${docRef.id}`);
        }

        console.log('🎉 Todos os documentos de teste foram criados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao criar documentos de teste:', error);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    createTestDocuments();
}

export { createTestDocuments };
