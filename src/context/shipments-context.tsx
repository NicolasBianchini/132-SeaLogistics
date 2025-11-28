"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type React from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../lib/firebaseConfig";
import {
  sendEmail,
  sendMaritimeShipmentUpdateEmail,
} from "../services/emailService";
import { UserRole } from "../types/user";
import { useAuth } from "./auth-context";

export interface Shipment {
  id?: string;
  cliente: string;
  operador: string;
  shipper: string;
  invoice: string;
  pol: string;
  pod: string;
  etdOrigem: string;
  etaDestino: string;
  currentLocation: string;
  quantBox: number;
  status: string;
  numeroBl: string;
  armador: string;
  booking: string;
  companyId?: string;
  tipo?: string;
  observacoes?: string;
  imo?: string;
  actualDeparture?: string;
  reportedEta?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

interface ShipmentsContextType {
  shipments: Shipment[];
  addShipment: (
    shipment: Omit<Shipment, "id" | "createdAt" | "companyId">
  ) => Promise<void>;
  updateShipment: (shipment: Shipment) => Promise<void>;
  canEditShipment: (shipment: Shipment) => boolean;
  canCreateShipment: () => boolean;
  deleteAllShipments: () => Promise<void>;
  loading: boolean;
}

const ShipmentsContext = createContext<ShipmentsContextType | undefined>(
  undefined
);

export const useShipments = () => {
  const context = useContext(ShipmentsContext);
  if (context === undefined) {
    throw new Error("useShipments must be used within a ShipmentsProvider");
  }
  return context;
};

interface ShipmentsProviderProps {
  children: ReactNode;
}

export const ShipmentsProvider: React.FC<ShipmentsProviderProps> = ({
  children,
}) => {
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
      q = query(collection(db, "shipments"), orderBy("createdAt", "desc"));
    } else if (
      currentUser.role === UserRole.COMPANY_USER &&
      currentUser.companyId
    ) {
      // Usuário de empresa vê apenas os shipments da sua empresa
      q = query(
        collection(db, "shipments"),
        where("companyId", "==", currentUser.companyId),
        orderBy("createdAt", "desc")
      );
    } else {
      // Fallback: sem shipments se não há permissão
      setShipments([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const shipmentsData: Shipment[] = [];
        querySnapshot.forEach((doc) => {
          shipmentsData.push({
            id: doc.id,
            ...doc.data(),
          } as Shipment);
        });

        console.log("📦 Shipments carregados do Firestore:", shipmentsData);

        setShipments(shipmentsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching shipments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  const addShipment = async (
    shipmentData: Omit<Shipment, "id" | "createdAt" | "companyId"> & {
      companyId?: string;
    }
  ) => {
    try {
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      const isAdmin_ = isAdmin();
      const isCompanyUser_ = currentUser.role === UserRole.COMPANY_USER;

      if (!isAdmin_ && !isCompanyUser_) {
        throw new Error("Você não tem permissão para criar novos shipments");
      }

      let companyIdToUse = shipmentData.companyId;

      if (isCompanyUser_) {
        // Company users must use their own companyId
        if (
          shipmentData.companyId &&
          shipmentData.companyId !== currentUser.companyId
        ) {
          throw new Error("Você só pode criar envios para sua própria empresa");
        }
        companyIdToUse = currentUser.companyId;
      }

      const shipmentWithCompany: Record<string, unknown> = {
        ...shipmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (companyIdToUse !== undefined) {
        shipmentWithCompany.companyId = companyIdToUse;
      } else {
        delete shipmentWithCompany.companyId;
      }

      const docRef = await addDoc(
        collection(db, "shipments"),
        shipmentWithCompany
      );
      console.log("Shipment added with ID: ", docRef.id);

      // Enviar email de notificação
      if (companyIdToUse) {
        try {
          console.log("Buscando dados da empresa...");
          const companyDoc = await getDoc(doc(db, "companies", companyIdToUse));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            console.log("Dados da empresa:", companyData);

            if (companyData.contactEmail) {
              console.log(
                "Preparando para enviar email para:",
                companyData.contactEmail
              );
              await sendEmail({
                to: companyData.contactEmail,
                subject: `Novo envio criado - ${shipmentData.numeroBl}`,
                html: `
                                    <h2>Novo envio criado</h2>
                                    <p>Um novo envio foi criado com os seguintes detalhes:</p>
                                    <ul>
                                        <li><strong>Número BL:</strong> ${
                                          shipmentData.numeroBl
                                        }</li>
                                        <li><strong>Cliente:</strong> ${
                                          shipmentData.cliente
                                        }</li>
                                        <li><strong>Operador:</strong> ${
                                          shipmentData.operador
                                        }</li>
                                        <li><strong>Tipo de Transporte:</strong> ${
                                          shipmentData.tipo ||
                                          "Não especificado"
                                        }</li>
                                        <li><strong>${
                                          shipmentData.tipo === "Aéreo"
                                            ? "Aeroporto"
                                            : shipmentData.tipo === "Terrestre"
                                            ? "Local"
                                            : "Porto"
                                        } de Origem:</strong> ${
                  shipmentData.pol
                }</li>
                                        <li><strong>${
                                          shipmentData.tipo === "Aéreo"
                                            ? "Aeroporto"
                                            : shipmentData.tipo === "Terrestre"
                                            ? "Local"
                                            : "Porto"
                                        } de Destino:</strong> ${
                  shipmentData.pod
                }</li>
                                        <li><strong>ETD Origem:</strong> ${
                                          shipmentData.etdOrigem
                                        }</li>
                                        <li><strong>ETA Destino:</strong> ${
                                          shipmentData.etaDestino
                                        }</li>
                                        <li><strong>Localização Atual:</strong> ${
                                          shipmentData.currentLocation
                                        }</li>
                                        <li><strong>Quantidade de Containers:</strong> ${
                                          shipmentData.quantBox
                                        }</li>
                                        <li><strong>Status:</strong> ${
                                          shipmentData.status
                                        }</li>
                                        <li><strong>Armador:</strong> ${
                                          shipmentData.armador
                                        }</li>
                                        <li><strong>Booking:</strong> ${
                                          shipmentData.booking
                                        }</li>
                                        <li><strong>Invoice:</strong> ${
                                          shipmentData.invoice
                                        }</li>
                                        ${
                                          shipmentData.observacoes
                                            ? `<li><strong>Observações:</strong> ${shipmentData.observacoes}</li>`
                                            : ""
                                        }
                                    </ul>
                                `,
              });
            } else {
              console.log("Empresa não tem email de contato cadastrado");
            }
          } else {
            console.log("Empresa não encontrada no Firestore");
          }
        } catch (error) {
          console.error("=== ERRO AO ENVIAR EMAIL DE NOTIFICAÇÃO ===");
          console.error("Detalhes do erro:", error);
        }
      }
    } catch (error) {
      console.error("Error adding shipment: ", error);
      throw error;
    }
  };

  const updateShipment = async (updatedShipment: Shipment) => {
    try {
      if (!updatedShipment.id) {
        throw new Error("Shipment ID is required for updates");
      }

      if (!canEditShipment(updatedShipment)) {
        throw new Error("Sem permissão para editar este shipment");
      }

      console.log("=== INICIANDO ATUALIZAÇÃO DE SHIPMENT ===");
      console.log("ID do shipment:", updatedShipment.id);
      console.log("Company ID:", updatedShipment.companyId);

      const shipmentRef = doc(db, "shipments", updatedShipment.id);
      const currentShipmentDoc = await getDoc(shipmentRef);

      if (!currentShipmentDoc.exists()) {
        throw new Error("Shipment não encontrado");
      }

      const currentShipment = currentShipmentDoc.data();
      const oldStatus = currentShipment.status;

      console.log("Status atual:", oldStatus);
      console.log("Novo status:", updatedShipment.status);

      // Atualizar todos os campos do shipment
      await updateDoc(shipmentRef, {
        cliente: updatedShipment.cliente,
        operador: updatedShipment.operador,
        shipper: updatedShipment.shipper,
        pol: updatedShipment.pol,
        pod: updatedShipment.pod,
        etdOrigem: updatedShipment.etdOrigem,
        etaDestino: updatedShipment.etaDestino,
        currentLocation: updatedShipment.currentLocation,
        quantBox: updatedShipment.quantBox,
        status: updatedShipment.status,
        numeroBl: updatedShipment.numeroBl,
        armador: updatedShipment.armador,
        booking: updatedShipment.booking,
        invoice: updatedShipment.invoice,
        observacoes: updatedShipment.observacoes || "", // Incluir observações
        tipo: updatedShipment.tipo || "", // Incluir tipo de transporte
        imo: updatedShipment.imo || "", // Incluir IMO do navio
        actualDeparture: updatedShipment.actualDeparture || "", // Incluir horário real de partida
        reportedEta: updatedShipment.reportedEta || "", // Incluir ETA reportado
        updatedAt: new Date(),
      });

      // Enviar email de notificação se o status mudou
      if (oldStatus !== updatedShipment.status && updatedShipment.companyId) {
        try {
          console.log("Status alterado, buscando dados da empresa...");
          console.log("Company ID para busca:", updatedShipment.companyId);

          const companyDoc = await getDoc(
            doc(db, "companies", updatedShipment.companyId)
          );
          console.log("Documento da empresa encontrado:", companyDoc.exists());

          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            console.log("Dados da empresa:", companyData);

            if (companyData.contactEmail) {
              console.log(
                "Preparando para enviar email para:",
                companyData.contactEmail
              );
              // Usar o novo template de email para embarques marítimos
              if (updatedShipment.tipo === "Marítimo") {
                await sendMaritimeShipmentUpdateEmail(
                  companyData.contactEmail,
                  companyData.name || "Cliente",
                  {
                    vessel: updatedShipment.armador,
                    originPort: updatedShipment.pol,
                    destinationPort: updatedShipment.pod,
                    booking: updatedShipment.booking,
                    blNumber: updatedShipment.numeroBl,
                    etd: updatedShipment.etdOrigem,
                    eta: updatedShipment.etaDestino,
                    currentLocation: updatedShipment.currentLocation,
                    status: updatedShipment.status,
                    imo: updatedShipment.imo || "9735206",
                    actualDeparture:
                      updatedShipment.actualDeparture ||
                      `${updatedShipment.etdOrigem} 21:19 (UTC-5)`,
                    reportedEta:
                      updatedShipment.reportedEta ||
                      `${updatedShipment.etaDestino} 12:00 (UTC-3)`,
                  }
                );
              } else {
                // Email padrão para outros tipos de transporte
                await sendEmail({
                  to: companyData.contactEmail,
                  subject: `Status do envio atualizado - ${updatedShipment.numeroBl}`,
                  html: `
                                    <h2>Status do envio atualizado</h2>
                                    <p>O status do seu envio foi atualizado:</p>
                                    <ul>
                                        <li><strong>Número BL:</strong> ${
                                          updatedShipment.numeroBl
                                        }</li>
                                        <li><strong>Status Anterior:</strong> ${oldStatus}</li>
                                        <li><strong>Novo Status:</strong> ${
                                          updatedShipment.status
                                        }</li>
                                        <li><strong>Cliente:</strong> ${
                                          updatedShipment.cliente
                                        }</li>
                                        <li><strong>Tipo de Transporte:</strong> ${
                                          updatedShipment.tipo ||
                                          "Não especificado"
                                        }</li>
                                        <li><strong>Porto de Origem:</strong> ${
                                          updatedShipment.pol
                                        }</li>
                                        <li><strong>Porto de Destino:</strong> ${
                                          updatedShipment.pod
                                        }</li>
                                        <li><strong>Localização Atual:</strong> ${
                                          updatedShipment.currentLocation
                                        }</li>
                                        <li><strong>Observações:</strong> ${
                                          updatedShipment.observacoes
                                        }</li>
                                    </ul>
                                `,
                });
              }
            } else {
              console.log("Empresa não tem email de contato cadastrado");
            }
          } else {
            console.log("Empresa não encontrada no Firestore");
          }
        } catch (error) {
          console.error("=== ERRO AO ENVIAR EMAIL DE NOTIFICAÇÃO ===");
          console.error("Detalhes do erro:", error);
        }
      } else {
        console.log("Status não foi alterado ou shipment não tem companyId");
        console.log(
          "oldStatus === updatedShipment.status:",
          oldStatus === updatedShipment.status
        );
        console.log("updatedShipment.companyId:", updatedShipment.companyId);
      }

      console.log("Shipment updated successfully:", updatedShipment.id);
    } catch (error) {
      console.error("Error updating shipment: ", error);
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
    return isAdmin() || currentUser?.role === UserRole.COMPANY_USER;
  };

  const deleteAllShipments = async () => {
    try {
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      if (!isAdmin()) {
        throw new Error(
          "Apenas administradores podem deletar todos os shipments"
        );
      }

      console.log("Deletando todos os shipments do banco de dados...");

      // Query all shipments
      const q = query(collection(db, "shipments"));
      const querySnapshot = await getDocs(q);

      // Delete each shipment
      const deletePromises = querySnapshot.docs.map((document) =>
        deleteDoc(doc(db, "shipments", document.id))
      );

      await Promise.all(deletePromises);

      console.log(
        `${querySnapshot.docs.length} shipments deletados com sucesso`
      );
    } catch (error) {
      console.error("Error deleting all shipments: ", error);
      throw error;
    }
  };

  const value: ShipmentsContextType = {
    shipments,
    addShipment,
    updateShipment,
    canEditShipment,
    canCreateShipment,
    deleteAllShipments,
    loading,
  };

  return (
    <ShipmentsContext.Provider value={value}>
      {children}
    </ShipmentsContext.Provider>
  );
};
