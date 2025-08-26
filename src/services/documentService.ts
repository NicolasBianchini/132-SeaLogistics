import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  type Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import type { Document, DocumentType } from '../types/document';

// Upload de documento para Firebase Storage (simulado por enquanto)
export const uploadDocumentToStorage = async (
  file: File, 
  shipmentId: string
): Promise<string> => {
  // Simulação de upload - em produção usar Firebase Storage
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeUrl = `https://storage.googleapis.com/sealogistics-docs/${shipmentId}/${file.name}`;
      resolve(fakeUrl);
    }, 1000);
  });
};

// Salvar documento no Firestore
export const saveDocument = async (documentData: Omit<Document, 'id' | 'uploadedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...documentData,
      uploadedAt: new Date(),
      isActive: true
    });
    
    console.log('Documento salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar documento:', error);
    throw error;
  }
};

// Buscar documentos de um shipment
export const getDocumentsByShipment = async (shipmentId: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('shipmentId', '==', shipmentId),
      where('isActive', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents: Document[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        uploadedAt: (data.uploadedAt as Timestamp).toDate()
      } as Document);
    });
    
    return documents;
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    throw error;
  }
};

// Buscar documentos por tipo
export const getDocumentsByType = async (
  shipmentId: string, 
  documentType: DocumentType
): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('shipmentId', '==', shipmentId),
      where('documentType', '==', documentType),
      where('isActive', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents: Document[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        uploadedAt: (data.uploadedAt as Timestamp).toDate()
      } as Document);
    });
    
    return documents;
  } catch (error) {
    console.error('Erro ao buscar documentos por tipo:', error);
    throw error;
  }
};

// Atualizar documento
export const updateDocument = async (
  documentId: string, 
  updates: Partial<Document>
): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    console.log('Documento atualizado:', documentId);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Deletar documento (soft delete)
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isActive: false,
      deletedAt: new Date()
    });
    
    console.log('Documento deletado:', documentId);
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    throw error;
  }
};

// Validar tipo de arquivo
export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  return allowedTypes.includes(file.type);
};

// Validar tamanho do arquivo (máximo 10MB)
export const validateFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};

// Formatar tamanho do arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Obter extensão do arquivo
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Detectar tipo de documento baseado no nome do arquivo
export const detectDocumentType = (fileName: string): DocumentType => {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('bl') || lowerFileName.includes('bill') || lowerFileName.includes('lading')) {
    return DocumentType.BILL_OF_LADING;
  }
  
  if (lowerFileName.includes('invoice') || lowerFileName.includes('inv')) {
    return DocumentType.INVOICE;
  }
  
  if (lowerFileName.includes('packing') || lowerFileName.includes('pack')) {
    return DocumentType.PACKING_LIST;
  }
  
  if (lowerFileName.includes('commercial')) {
    return DocumentType.COMMERCIAL_INVOICE;
  }
  
  if (lowerFileName.includes('certificate') || lowerFileName.includes('origin')) {
    return DocumentType.CERTIFICATE_OF_ORIGIN;
  }
  
  if (lowerFileName.includes('insurance')) {
    return DocumentType.INSURANCE_CERTIFICATE;
  }
  
  if (lowerFileName.includes('export') || lowerFileName.includes('license')) {
    return DocumentType.EXPORT_LICENSE;
  }
  
  if (lowerFileName.includes('import')) {
    return DocumentType.IMPORT_LICENSE;
  }
  
  if (lowerFileName.includes('customs') || lowerFileName.includes('declaration')) {
    return DocumentType.CUSTOMS_DECLARATION;
  }
  
  if (lowerFileName.includes('transport') || lowerFileName.includes('shipping')) {
    return DocumentType.TRANSPORT_DOCUMENT;
  }
  
  return DocumentType.OTHER;
};
