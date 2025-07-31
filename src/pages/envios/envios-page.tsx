"use client";

import { useContext } from "react";
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import { NavbarContext } from "../../components/navbar/navbar-context";
import ShippingTable, {
  type Shipment,
} from "../../components/shipping-table/shipping-table";
import { LanguageProvider } from "../../context/language-context";
import "./envios-page.css";

export const EnviosPage = () => {
  const { isCollapsed } = useContext(NavbarContext);

  const handleShipmentUpdate = (updatedShipment: Shipment) => {
    console.log("Envio atualizado na página de envios:", updatedShipment);
  };

  return (
    <LanguageProvider>
      <main className="envios-container">
        <Navbar />
        <div
          className={`envios-content ${isCollapsed ? "navbar-collapsed" : ""}`}
        >
          <ShippingTable onShipmentUpdate={handleShipmentUpdate} />
        </div>
        <ChatAssistant />
      </main>
    </LanguageProvider>
  );
};
