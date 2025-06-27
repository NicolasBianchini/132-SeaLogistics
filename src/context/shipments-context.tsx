import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuth } from './auth-context';
import { UserRole } from '../types/user';

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

            // Apenas admins podem criar shipments
            if (!isAdmin()) {
                throw new Error('Apenas administradores podem criar novos shipments');
            }

            // Montar objeto sem companyId se for undefined
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

            // Atualizar no Firebase
            const shipmentRef = doc(db, 'shipments', updatedShipment.id);

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

            console.log('Shipment updated successfully:', updatedShipment.id);

            // O estado local será atualizado automaticamente via onSnapshot
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