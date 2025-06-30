import { createContext, useContext, useState } from "react";
import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import ShippingTable, { Shipment } from "../../components/shipping-table/shipping-table";
import { LanguageProvider } from "../../context/language-context";
import "./envios-page.css";

// Context para gerenciar o estado da navbar
const NavbarContext = createContext<{
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useNavbar = () => useContext(NavbarContext);

export const EnviosPage = () => {
    const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);

    const handleShipmentUpdate = (updatedShipment: Shipment) => {
        console.log("Envio atualizado na página de envios:", updatedShipment);
    };

    return (
        <LanguageProvider>
            <NavbarContext.Provider
                value={{
                    isCollapsed: isNavbarCollapsed,
                    setIsCollapsed: setIsNavbarCollapsed
                }}
            >
                <main className="envios-container">
                    <Navbar />
                    <div className={`envios-content ${isNavbarCollapsed ? 'navbar-collapsed' : ''}`}>
                        <ShippingTable
                            onShipmentUpdate={handleShipmentUpdate}
                        />
                    </div>
                    <ChatAssistant />
                </main>
            </NavbarContext.Provider>
        </LanguageProvider>
    );
}; 