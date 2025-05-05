import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import ShippingTable from "../../components/shipping-table/shipping-table";
import { LanguageProvider } from "../../context/language-context";
import "./home-page.css";

export const HomePage = () => {
  return (
    <LanguageProvider>
      <main className="home-container">
        <Navbar />
        <div className="home-content">
          <ShippingTable />
        </div>
        <ChatAssistant />
      </main>
    </LanguageProvider>
  );
};
