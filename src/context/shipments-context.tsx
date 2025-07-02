import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuth } from './auth-context';
import { UserRole } from '../types/user';
import { sendEmail } from '../services/emailService';

export interface Shipment {
    id?: string;
    cliente: string;
    operador: string;
    pol: string;
    pod: string;
    etdOrigem: string;
    etaDestino: string;
    quantBox: number;
    status: string;
    numeroBl: string;
    armador: string;
    booking: string;
    companyId?: string; // ID da empresa dona do shipment
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

interface ShipmentsContextType {
    shipments: Shipment[];
    addShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'companyId'>) => Promise<void>;
    updateShipment: (shipment: Shipment) => Promise<void>;
    canEditShipment: (shipment: Shipment) => boolean;
    canCreateShipment: () => boolean;
    loading: boolean;
}

const ShipmentsContext = createContext<ShipmentsContextType | undefined>(undefined);

export const useShipments = () => {
    const context = useContext(ShipmentsContext);
    if (context === undefined) {
        throw new Error('useShipments must be used within a ShipmentsProvider');
    }
    return context;
};

interface ShipmentsProviderProps {
    children: ReactNode;
}

export const ShipmentsProvider: React.FC<ShipmentsProviderProps> = ({ children }) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, isAdmin } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setShipments([]);
            setLoading(false);
            return;
        }

        let q;

        if (isAdmin()) {
            // Admin vê todos os shipments
            q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
        } else if (currentUser.role === UserRole.COMPANY_USER && currentUser.companyId) {
            // Usuário de empresa vê apenas os shipments da sua empresa
            q = query(
                collection(db, 'shipments'),
                where('companyId', '==', currentUser.companyId),
                orderBy('createdAt', 'desc')
            );
        } else {
            // Fallback: sem shipments se não há permissão
            setShipments([]);
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const shipmentsData: Shipment[] = [];
            querySnapshot.forEach((doc) => {
                shipmentsData.push({
                    id: doc.id,
                    ...doc.data(),
                } as Shipment);
            });
            setShipments(shipmentsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching shipments:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, isAdmin]);

    const addShipment = async (shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'companyId'> & { companyId?: string }) => {
        try {
            if (!currentUser) {
                throw new Error('Usuário não autenticado');
            }

            if (!isAdmin()) {
                throw new Error('Apenas administradores podem criar novos shipments');
            }

            const shipmentWithCompany: Record<string, unknown> = {
                ...shipmentData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            if (shipmentData.companyId !== undefined) {
                shipmentWithCompany.companyId = shipmentData.companyId;
            } else {
                delete shipmentWithCompany.companyId;
            }

            const docRef = await addDoc(collection(db, 'shipments'), shipmentWithCompany);
            console.log('Shipment added with ID: ', docRef.id);

            // Enviar email de notificação
            if (shipmentData.companyId) {
                try {
                    console.log('Buscando dados da empresa...');
                    const companyDoc = await getDoc(doc(db, 'companies', shipmentData.companyId));
                    if (companyDoc.exists()) {
                        const companyData = companyDoc.data();
                        console.log('Dados da empresa:', companyData);

                        if (companyData.contactEmail) {
                            console.log('Preparando para enviar email para:', companyData.contactEmail);
                            await sendEmail({
                                to: companyData.contactEmail,
                                subject: `Novo envio criado - ${shipmentData.numeroBl}`,
                                html: `
                                    <h2>Novo envio criado</h2>
                                    <p>Um novo envio foi criado com os seguintes detalhes:</p>
                                    <ul>
                                        <li><strong>Número BL:</strong> ${shipmentData.numeroBl}</li>
                                        <li><strong>Cliente:</strong> ${shipmentData.cliente}</li>
                                        <li><strong>Operador:</strong> ${shipmentData.operador}</li>
                                        <li><strong>Porto de Origem:</strong> ${shipmentData.pol}</li>
                                        <li><strong>Porto de Destino:</strong> ${shipmentData.pod}</li>
                                        <li><strong>ETD Origem:</strong> ${shipmentData.etdOrigem}</li>
                                        <li><strong>ETA Destino:</strong> ${shipmentData.etaDestino}</li>
                                        <li><strong>Quantidade de Containers:</strong> ${shipmentData.quantBox}</li>
                                        <li><strong>Status:</strong> ${shipmentData.status}</li>
                                        <li><strong>Armador:</strong> ${shipmentData.armador}</li>
                                        <li><strong>Booking:</strong> ${shipmentData.booking}</li>
                                    </ul>
                                `
                            });
                        } else {
                            console.log('Empresa não tem email de contato cadastrado');
                        }
                    } else {
                        console.log('Empresa não encontrada no Firestore');
                    }
                } catch (error) {
                    console.error('=== ERRO AO ENVIAR EMAIL DE NOTIFICAÇÃO ===');
                    console.error('Detalhes do erro:', error);
                }
            }
        } catch (error) {
            console.error('Error adding shipment: ', error);
            throw error;
        }
    };

    const updateShipment = async (updatedShipment: Shipment) => {
        try {
            if (!updatedShipment.id) {
                throw new Error('Shipment ID is required for updates');
            }

            if (!canEditShipment(updatedShipment)) {
                throw new Error('Sem permissão para editar este shipment');
            }

            console.log('=== INICIANDO ATUALIZAÇÃO DE SHIPMENT ===');
            console.log('ID do shipment:', updatedShipment.id);
            console.log('Company ID:', updatedShipment.companyId);

            const shipmentRef = doc(db, 'shipments', updatedShipment.id);
            const currentShipmentDoc = await getDoc(shipmentRef);

            if (!currentShipmentDoc.exists()) {
                throw new Error('Shipment não encontrado');
            }

            const currentShipment = currentShipmentDoc.data();
            const oldStatus = currentShipment.status;

            console.log('Status atual:', oldStatus);
            console.log('Novo status:', updatedShipment.status);

            await updateDoc(shipmentRef, {
                cliente: updatedShipment.cliente,
                operador: updatedShipment.operador,
                pol: updatedShipment.pol,
                pod: updatedShipment.pod,
                etdOrigem: updatedShipment.etdOrigem,
                etaDestino: updatedShipment.etaDestino,
                quantBox: updatedShipment.quantBox,
                status: updatedShipment.status,
                numeroBl: updatedShipment.numeroBl,
                armador: updatedShipment.armador,
                booking: updatedShipment.booking,
                updatedAt: new Date()
            });

            // Enviar email de notificação se o status mudou
            if (oldStatus !== updatedShipment.status && updatedShipment.companyId) {
                try {
                    console.log('Status alterado, buscando dados da empresa...');
                    console.log('Company ID para busca:', updatedShipment.companyId);

                    const companyDoc = await getDoc(doc(db, 'companies', updatedShipment.companyId));
                    console.log('Documento da empresa encontrado:', companyDoc.exists());

                    if (companyDoc.exists()) {
                        const companyData = companyDoc.data();
                        console.log('Dados da empresa:', companyData);

                        if (companyData.contactEmail) {
                            console.log('Preparando para enviar email para:', companyData.contactEmail);
                            await sendEmail({
                                to: companyData.contactEmail,
                                subject: `Status do envio atualizado - ${updatedShipment.numeroBl}`,
                                html: `
                                    <h2>Status do envio atualizado</h2>
                                    <p>O status do seu envio foi atualizado:</p>
                                    <ul>
                                        <li><strong>Número BL:</strong> ${updatedShipment.numeroBl}</li>
                                        <li><strong>Status Anterior:</strong> ${oldStatus}</li>
                                        <li><strong>Novo Status:</strong> ${updatedShipment.status}</li>
                                        <li><strong>Cliente:</strong> ${updatedShipment.cliente}</li>
                                        <li><strong>Porto de Origem:</strong> ${updatedShipment.pol}</li>
                                        <li><strong>Porto de Destino:</strong> ${updatedShipment.pod}</li>
                                    </ul>
                                `
                            });
                        } else {
                            console.log('Empresa não tem email de contato cadastrado');
                        }
                    } else {
                        console.log('Empresa não encontrada no Firestore');
                    }
                } catch (error) {
                    console.error('=== ERRO AO ENVIAR EMAIL DE NOTIFICAÇÃO ===');
                    console.error('Detalhes do erro:', error);
                }
            } else {
                console.log('Status não foi alterado ou shipment não tem companyId');
                console.log('oldStatus === updatedShipment.status:', oldStatus === updatedShipment.status);
                console.log('updatedShipment.companyId:', updatedShipment.companyId);
            }

            console.log('Shipment updated successfully:', updatedShipment.id);
        } catch (error) {
            console.error('Error updating shipment: ', error);
            throw error;
        }
    };

    const canEditShipment = (shipment: Shipment): boolean => {
        if (!currentUser) return false;

        // Admin pode editar qualquer shipment
        if (isAdmin()) return true;

        // Usuário de empresa só pode editar shipments da própria empresa
        if (currentUser.role === UserRole.COMPANY_USER) {
            return shipment.companyId === currentUser.companyId;
        }

        return false;
    };

    const canCreateShipment = (): boolean => {
        // Apenas admins podem criar shipments
        return isAdmin();
    };

    const value: ShipmentsContextType = {
        shipments,
        addShipment,
        updateShipment,
        canEditShipment,
        canCreateShipment,
        loading,
    };

    return (
        <ShipmentsContext.Provider value={value}>
            {children}
        </ShipmentsContext.Provider>
    );
}; 