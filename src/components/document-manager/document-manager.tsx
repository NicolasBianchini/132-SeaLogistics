import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  Package,
  Award,
  Shield,
  ScrollText,
  Building,
  Ship,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useLanguage } from '../../context/language-context';
import type { Document, DocumentUploadProgress } from '../../types/document';
import { DocumentType } from '../../types/document';
import {
  getDocumentTypeLabel,
  DocumentTypeIcons
} from '../../types/document';

// Função para renderizar o ícone correto baseado no tipo
const renderDocumentIcon = (iconName: string) => {
  switch (iconName) {
    case 'file-text':
      return <FileText size={16} />;
    case 'receipt':
      return <Receipt size={16} />;
    case 'package':
      return <Package size={16} />;
    case 'award':
      return <Award size={16} />;
    case 'shield':
      return <Shield size={16} />;
    case 'scroll-text':
      return <ScrollText size={16} />;
    case 'building':
      return <Building size={16} />;
    case 'ship':
      return <Ship size={16} />;
    case 'paperclip':
      return <Paperclip size={16} />;
    default:
      return <FileText size={16} />;
  }
};
import {
  uploadDocumentToStorage,
  saveDocument,
  getDocumentsByShipment,
  deleteDocument,
  validateFileType,
  validateFileSize,
  formatFileSize,
  detectDocumentType,
  downloadDocument
} from '../../services/documentService';
import './document-manager.css';

interface DocumentManagerProps {
  shipmentId: string;
  shipmentNumber: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentsUpdate?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  shipmentId,
  shipmentNumber,
  clientName,
  isOpen,
  onClose,
  onDocumentsUpdate
}) => {
  const { currentUser } = useAuth();
  const { translations } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar documentos existentes
  const loadDocuments = useCallback(async () => {
    if (!shipmentId) return;

    try {
      setLoading(true);
      const docs = await getDocumentsByShipment(shipmentId);
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, loadDocuments]);

  // Gerenciar drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Selecionar arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      if (!validateFileType(file)) {
        errors.push(`${file.name}: Tipo de arquivo não suportado`);
      } else if (!validateFileSize(file)) {
        errors.push(`${file.name}: Arquivo muito grande (máximo 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(null), 5000);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Remover arquivo selecionado
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload de documentos
  const uploadDocuments = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const progress: DocumentUploadProgress[] = selectedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(progress);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Atualizar progresso
        setUploadProgress(prev => prev.map((p, index) =>
          index === i ? { ...p, progress: 25 } : p
        ));

        // Upload para storage
        const downloadUrl = await uploadDocumentToStorage(file, shipmentId);

        setUploadProgress(prev => prev.map((p, index) =>
          index === i ? { ...p, progress: 75 } : p
        ));

        // Detectar tipo de documento
        const detectedType = detectDocumentType(file.name);

        // Garantir que o documentType seja sempre válido
        let finalDocumentType: DocumentType;
        if (selectedDocumentType !== DocumentType.OTHER) {
          finalDocumentType = selectedDocumentType;
        } else if (detectedType && Object.values(DocumentType).includes(detectedType)) {
          finalDocumentType = detectedType;
        } else {
          finalDocumentType = DocumentType.OTHER;
        }

        console.log('Document type debug:', {
          selectedDocumentType,
          detectedType,
          finalDocumentType,
          fileName: file.name
        });

        // Salvar no Firestore
        await saveDocument({
          shipmentId,
          fileName: file.name,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          documentType: finalDocumentType,
          uploadedBy: currentUser?.displayName || currentUser?.email || 'Usuário',
          downloadUrl,
          isActive: true
        });

        setUploadProgress(prev => prev.map((p, index) =>
          index === i ? { ...p, progress: 100, status: 'success' } : p
        ));
      }

      setSuccess(`${selectedFiles.length} documento(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      setSelectedDocumentType(DocumentType.OTHER);

      // Recarregar documentos
      await loadDocuments();

      // Notificar componente pai
      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro no upload:', error);
      setError('Erro ao fazer upload dos documentos');

      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error',
        error: 'Erro no upload'
      })));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  // Deletar documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await deleteDocument(documentId);
      setSuccess('Documento excluído com sucesso!');
      await loadDocuments();

      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      setError('Erro ao excluir documento');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Download de documento
  const handleDownload = async (doc: Document) => {
    try {
      await downloadDocument(doc);
    } catch (error) {
      console.error('Erro no download:', error);
      setError('Erro ao fazer download do documento');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Agrupar documentos por tipo
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.documentType]) {
      acc[doc.documentType] = [];
    }
    acc[doc.documentType].push(doc);
    return acc;
  }, {} as Record<DocumentType, Document[]>);

  if (!isOpen) return null;

  const modalContent = (
    <div className="document-manager-overlay" onClick={onClose}>
      <div className="document-manager-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="document-manager-header">
          <div className="header-info">
            <h2>📋 Gerenciar Documentos</h2>
            <div className="shipment-info">
              <span><strong>Envio:</strong> {shipmentNumber}</span>
              <span><strong>Cliente:</strong> {clientName}</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="document-manager-content">
          {/* Seção de Upload */}
          <div className="upload-section">
            <h3>📤 Adicionar Novos Documentos</h3>

            {/* Seleção de tipo de documento */}
            <div className="document-type-selector">
              <label htmlFor="documentType">Tipo de Documento:</label>
              <select
                id="documentType"
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
                disabled={uploading}
              >
                <option value={DocumentType.BILL_OF_LADING}>Conhecimento de Embarque (BL)</option>
                <option value={DocumentType.INVOICE}>Fatura</option>
                <option value={DocumentType.PACKING_LIST}>Lista de Empacotamento</option>
                <option value={DocumentType.COMMERCIAL_INVOICE}>Fatura Comercial</option>
                <option value={DocumentType.CERTIFICATE_OF_ORIGIN}>Certificado de Origem</option>
                <option value={DocumentType.INSURANCE_CERTIFICATE}>Certificado de Seguro</option>
                <option value={DocumentType.EXPORT_LICENSE}>Licença de Exportação</option>
                <option value={DocumentType.IMPORT_LICENSE}>Licença de Importação</option>
                <option value={DocumentType.CUSTOMS_DECLARATION}>Declaração Aduaneira</option>
                <option value={DocumentType.TRANSPORT_DOCUMENT}>Documento de Transporte</option>
                <option value={DocumentType.OTHER}>Outro</option>
              </select>
            </div>

            {/* Área de upload */}
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
                onChange={handleFileSelect}
                disabled={uploading}
                className="file-input"
              />

              <div className="upload-content">
                <Upload size={48} className="upload-icon" />
                <p>Arraste arquivos aqui ou clique para selecionar</p>
                <small>Tipos suportados: PDF, Word, Excel, Imagens, Texto</small>
                <small>Tamanho máximo: 10MB por arquivo</small>
              </div>
            </div>

            {/* Arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Arquivos Selecionados ({selectedFiles.length})</h4>
                <div className="file-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <FileText size={16} />
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="remove-file-btn"
                        disabled={uploading}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={uploadDocuments}
                  disabled={uploading || selectedFiles.length === 0}
                  className="upload-button"
                >
                  {uploading ? (
                    <>
                      <Clock size={16} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Enviar {selectedFiles.length} Documento(s)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Progresso do upload */}
            {uploadProgress.length > 0 && (
              <div className="upload-progress">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className={`progress-item ${progress.status}`}>
                    <div className="progress-info">
                      <span className="file-name">{progress.fileName}</span>
                      <span className="progress-status">
                        {progress.status === 'uploading' && <Clock size={14} />}
                        {progress.status === 'success' && <CheckCircle size={14} />}
                        {progress.status === 'error' && <AlertCircle size={14} />}
                        {progress.status}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    {progress.error && (
                      <span className="error-message">{progress.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Documentos Existentes */}
          <div className="existing-documents-section">
            <h3>📁 Documentos Existentes</h3>

            {loading ? (
              <div className="loading">Carregando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="no-documents">
                <FileText size={48} />
                <p>Nenhum documento carregado ainda</p>
                <small>Adicione documentos usando a seção acima</small>
              </div>
            ) : (
              <div className="documents-by-type">
                {Object.entries(documentsByType).map(([type, docs]) => (
                  <div key={type} className="document-type-group">
                    <h4>
                      {renderDocumentIcon(DocumentTypeIcons[type as DocumentType])}
                      {getDocumentTypeLabel(type as DocumentType, 'pt')}
                      ({docs.length})
                    </h4>

                    <div className="document-list">
                      {docs.map(doc => (
                        <div key={doc.id} className="document-item">
                          <div className="document-info">
                            <FileText size={16} />
                            <div className="document-details">
                              <span className="document-name">{doc.originalName}</span>
                              <span className="document-meta">
                                {formatFileSize(doc.fileSize)} •
                                {doc.uploadedAt.toLocaleDateString('pt-BR')} •
                                {doc.uploadedBy}
                              </span>
                            </div>
                          </div>

                          <div className="document-actions">
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="action-btn download-btn"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>

                            {currentUser?.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => doc.id && handleDeleteDocument(doc.id)}
                                className="action-btn delete-btn"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
