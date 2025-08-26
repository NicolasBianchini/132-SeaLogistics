import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, X, AlertCircle } from 'lucide-react';
import type { Document, DocumentType } from '../../types/document';
import { getDocumentTypeLabel, DocumentTypeIcons } from '../../types/document';
import { getDocumentsByShipment, deleteDocument } from '../../services/documentService';
import { useAuth } from '../../context/auth-context';
import './document-viewer.css';

interface DocumentViewerProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  shipmentId,
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && shipmentId) {
      loadDocuments();
    }
  }, [isOpen, shipmentId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocumentsByShipment(shipmentId);
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.downloadUrl;
    link.download = document.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await deleteDocument(documentId);
      await loadDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      setError('Erro ao excluir documento');
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

  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div className="document-viewer-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="document-viewer-header">
          <h2>📁 Documentos do Envio</h2>
          <p className="header-subtitle">Visualize e baixe os documentos relacionados</p>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="document-viewer-content">
          {loading ? (
            <div className="loading">Carregando documentos...</div>
          ) : documents.length === 0 ? (
            <div className="no-documents">
              <FileText size={48} />
              <p>Nenhum documento disponível no momento</p>
              <small>Nossa equipe está preparando a documentação para este envio</small>
            </div>
          ) : (
            <div className="documents-by-type">
              {Object.entries(documentsByType).map(([type, docs]) => (
                <div key={type} className="document-type-group">
                  <h3>
                    {DocumentTypeIcons[type as DocumentType]}
                    {getDocumentTypeLabel(type as DocumentType, t('language') || 'pt')}
                    <span className="document-count">({docs.length})</span>
                  </h3>

                  <div className="document-list">
                    {docs.map(doc => (
                      <div key={doc.id} className="document-item">
                        <div className="document-info">
                          <FileText size={20} className="document-icon" />
                          <div className="document-details">
                            <span className="document-name">{doc.originalName}</span>
                            <div className="document-meta">
                              <span className="upload-date">
                                {doc.uploadedAt.toLocaleDateString('pt-BR')}
                              </span>
                              <span className="uploader">
                                por {doc.uploadedBy}
                              </span>
                            </div>
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
                            <span className="btn-text">Baixar</span>
                          </button>
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
  );
};
