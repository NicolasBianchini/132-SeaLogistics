import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

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
    createdAt?: Timestamp | Date;
}

interface ShipmentsContextType {
    shipments: Shipment[];
    addShipment: (shipment: Omit<Shipment, 'id' | 'createdAt'>) => Promise<void>;
    updateShipment: (shipment: Shipment) => Promise<void>;
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

    useEffect(() => {
        const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));

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
    }, []);

    const addShipment = async (shipmentData: Omit<Shipment, 'id' | 'createdAt'>) => {
        try {
            const docRef = await addDoc(collection(db, 'shipments'), {
                ...shipmentData,
                createdAt: new Date(),
            });
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

    const value: ShipmentsContextType = {
        shipments,
        addShipment,
        updateShipment,
        loading,
    };

    return (
        <ShipmentsContext.Provider value={value}>
            {children}
        </ShipmentsContext.Provider>
    );
}; 