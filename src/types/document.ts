export interface Document {
  id?: string;
  shipmentId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  uploadedBy: string;
  uploadedAt: Date;
  downloadUrl: string;
  isActive: boolean;
}

export enum DocumentType {
  BILL_OF_LADING = 'bill_of_lading',
  INVOICE = 'invoice',
  PACKING_LIST = 'packing_list',
  COMMERCIAL_INVOICE = 'commercial_invoice',
  CERTIFICATE_OF_ORIGIN = 'certificate_of_origin',
  INSURANCE_CERTIFICATE = 'insurance_certificate',
  EXPORT_LICENSE = 'export_license',
  IMPORT_LICENSE = 'import_license',
  CUSTOMS_DECLARATION = 'customs_declaration',
  TRANSPORT_DOCUMENT = 'transport_document',
  OTHER = 'other'
}

// Função para obter as traduções dos tipos de documento
export const getDocumentTypeLabel = (documentType: DocumentType, language: string = 'pt'): string => {
  const labels: Record<string, Record<DocumentType, string>> = {
    en: {
      [DocumentType.BILL_OF_LADING]: 'Bill of Lading (BL)',
      [DocumentType.INVOICE]: 'Invoice',
      [DocumentType.PACKING_LIST]: 'Packing List',
      [DocumentType.COMMERCIAL_INVOICE]: 'Commercial Invoice',
      [DocumentType.CERTIFICATE_OF_ORIGIN]: 'Certificate of Origin',
      [DocumentType.INSURANCE_CERTIFICATE]: 'Insurance Certificate',
      [DocumentType.EXPORT_LICENSE]: 'Export License',
      [DocumentType.IMPORT_LICENSE]: 'Import License',
      [DocumentType.CUSTOMS_DECLARATION]: 'Customs Declaration',
      [DocumentType.TRANSPORT_DOCUMENT]: 'Transport Document',
      [DocumentType.OTHER]: 'Other'
    },
    pt: {
      [DocumentType.BILL_OF_LADING]: 'Conhecimento de Embarque (BL)',
      [DocumentType.INVOICE]: 'Fatura',
      [DocumentType.PACKING_LIST]: 'Lista de Empacotamento',
      [DocumentType.COMMERCIAL_INVOICE]: 'Fatura Comercial',
      [DocumentType.CERTIFICATE_OF_ORIGIN]: 'Certificado de Origem',
      [DocumentType.INSURANCE_CERTIFICATE]: 'Certificado de Seguro',
      [DocumentType.EXPORT_LICENSE]: 'Licença de Exportação',
      [DocumentType.IMPORT_LICENSE]: 'Licença de Importação',
      [DocumentType.CUSTOMS_DECLARATION]: 'Declaração Aduaneira',
      [DocumentType.TRANSPORT_DOCUMENT]: 'Documento de Transporte',
      [DocumentType.OTHER]: 'Outro'
    },
    es: {
      [DocumentType.BILL_OF_LADING]: 'Conocimiento de Embarque (BL)',
      [DocumentType.INVOICE]: 'Factura',
      [DocumentType.PACKING_LIST]: 'Lista de Empaque',
      [DocumentType.COMMERCIAL_INVOICE]: 'Factura Comercial',
      [DocumentType.CERTIFICATE_OF_ORIGIN]: 'Certificado de Origen',
      [DocumentType.INSURANCE_CERTIFICATE]: 'Certificado de Seguro',
      [DocumentType.EXPORT_LICENSE]: 'Licencia de Exportación',
      [DocumentType.IMPORT_LICENSE]: 'Licencia de Importación',
      [DocumentType.CUSTOMS_DECLARATION]: 'Declaración Aduanera',
      [DocumentType.TRANSPORT_DOCUMENT]: 'Documento de Transporte',
      [DocumentType.OTHER]: 'Otro'
    }
  };

  return labels[language]?.[documentType] || labels.pt[documentType];
};

export const DocumentTypeIcons: Record<DocumentType, string> = {
  [DocumentType.BILL_OF_LADING]: 'file-text',
  [DocumentType.INVOICE]: 'receipt',
  [DocumentType.PACKING_LIST]: 'package',
  [DocumentType.COMMERCIAL_INVOICE]: 'file-text',
  [DocumentType.CERTIFICATE_OF_ORIGIN]: 'award',
  [DocumentType.INSURANCE_CERTIFICATE]: 'shield',
  [DocumentType.EXPORT_LICENSE]: 'scroll-text',
  [DocumentType.IMPORT_LICENSE]: 'scroll-text',
  [DocumentType.CUSTOMS_DECLARATION]: 'building',
  [DocumentType.TRANSPORT_DOCUMENT]: 'ship',
  [DocumentType.OTHER]: 'paperclip'
};

export interface DocumentUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}
