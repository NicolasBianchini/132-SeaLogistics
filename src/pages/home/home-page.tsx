
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import ShippingTable, { Shipment } from "../../components/shipping-table/shipping-table";
import { LanguageProvider } from "../../context/language-context";
import "./home-page.css";

export const HomePage = () => {
  const handleShipmentUpdate = (updatedShipment: Shipment) => {
    console.log("Envio atualizado na home:", updatedShipment);
  };

  return (
    <LanguageProvider>
      <main className="home-container">
        <Navbar />
        <div className="home-content">
          <ShippingTable
            onShipmentUpdate={handleShipmentUpdate}
          />
        </div>
        <ChatAssistant />
      </main>
    </LanguageProvider>
  );
};
