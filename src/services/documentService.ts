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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../lib/firebaseConfig';
import type { Document, DocumentType } from '../types/document';

// Upload de documento para Firebase Storage
export const uploadDocumentToStorage = async (
  file: File,
  shipmentId: string
): Promise<string> => {
  try {
    // Verificar se estamos em localhost para evitar problemas de CORS
    const isLocalhost = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('localhost');

    if (isLocalhost) {
      console.log('Detectado localhost, usando fallback local');
      return createLocalUrl(file);
    }

    // Upload real para Firebase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `documents/${shipmentId}/${fileName}`);

    console.log('Fazendo upload para Firebase Storage:', fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('Upload concluído:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload para Firebase Storage:', error);

    // Fallback para URL local se Firebase Storage falhar
    console.log('Usando fallback local devido ao erro');
    return createLocalUrl(file);
  }
};

// Criar URL local como fallback
const createLocalUrl = (file: File): string => {
  const url = URL.createObjectURL(file);
  console.log('Criada URL local:', url);
  return url;
};

// Salvar documento no Firestore
export const saveDocument = async (documentData: Omit<Document, 'id' | 'uploadedAt'>): Promise<string> => {
  try {
    // Validar se documentType não é undefined
    if (!documentData.documentType) {
      console.error('documentType é undefined:', documentData);
      throw new Error('documentType é obrigatório');
    }

    console.log('Salvando documento:', {
      fileName: documentData.fileName,
      documentType: documentData.documentType,
      downloadUrl: documentData.downloadUrl
    });

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

// Download de documento
export const downloadDocument = async (doc: Document): Promise<void> => {
  try {
    console.log('Iniciando download:', {
      fileName: doc.originalName,
      downloadUrl: doc.downloadUrl,
      fileType: doc.fileType
    });

    // Verificar se a URL é válida
    if (!doc.downloadUrl || doc.downloadUrl.trim() === '') {
      console.warn('URL de download inválida, criando arquivo de informações');
      createInfoFile(doc);
      return;
    }

    // Detectar URLs antigas do bucket sealogistics-docs
    if (doc.downloadUrl.includes('sealogistics-docs')) {
      console.log('Detectada URL antiga, tentando download direto');
      try {
        const response = await fetch(doc.downloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          downloadBlob(blob, doc.originalName);
          return;
        }
      } catch (error) {
        console.log('Download direto falhou, criando arquivo de informações');
      }
      createInfoFile(doc);
      return;
    }

    // URLs blob: (arquivos locais)
    if (doc.downloadUrl.startsWith('blob:')) {
      console.log('Download de arquivo local');
      try {
        // Verificar se a URL blob ainda é válida
        const response = await fetch(doc.downloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          downloadBlob(blob, doc.originalName);
          return;
        } else {
          throw new Error('URL blob inválida');
        }
      } catch (error) {
        console.error('Erro ao baixar arquivo local:', error);
        console.log('URL blob expirada ou inválida, criando arquivo de informações');
        createInfoFile(doc);
        return;
      }
    }

    // URLs do Firebase Storage
    if (doc.downloadUrl.includes('firebasestorage.googleapis.com')) {
      console.log('Download do Firebase Storage');
      window.open(doc.downloadUrl, '_blank');
      return;
    }

    // Outras URLs externas
    console.log('Tentando download de URL externa');
    try {
      const response = await fetch(doc.downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, doc.originalName);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erro no download:', error);
      createInfoFile(doc);
    }

  } catch (error) {
    console.error('Erro geral no download:', error);
    createInfoFile(doc);
  }
};

// Criar arquivo de informações quando o download original falha
const createInfoFile = (doc: Document): void => {
  const info = `INFORMAÇÕES DO DOCUMENTO
================================

📄 Nome do Arquivo: ${doc.originalName}
📁 Tipo de Arquivo: ${doc.fileType}
📊 Tamanho: ${formatFileSize(doc.fileSize)}
📅 Data de Upload: ${doc.uploadedAt.toLocaleDateString('pt-BR')} às ${doc.uploadedAt.toLocaleTimeString('pt-BR')}
👤 Enviado por: ${doc.uploadedBy}
🏷️  Tipo de Documento: ${doc.documentType}
🔗 URL Original: ${doc.downloadUrl}

⚠️  NOTA IMPORTANTE:
O arquivo original não está mais disponível para download.
Isso pode acontecer quando:
- O arquivo foi removido do servidor
- A URL expirou (arquivos temporários)
- Houve um problema de conectividade

💡 SOLUÇÃO:
Para obter o arquivo original, entre em contato com o administrador
ou solicite um novo upload do documento.

---
Gerado automaticamente pelo sistema Sea Logistics
Data: ${new Date().toLocaleString('pt-BR')}`;

  const blob = new Blob([info], { type: 'text/plain; charset=utf-8' });
  const fileName = `INFO_${doc.originalName.replace(/\.[^/.]+$/, '.txt')}`;
  downloadBlob(blob, fileName);
};

// Download de blob
const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
