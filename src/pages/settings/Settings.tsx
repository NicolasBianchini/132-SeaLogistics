import ChatAssistant from "../../components/chat-assistant/chat-assistant";
import Navbar from "../../components/navbar/navbar";
import { LanguageProvider } from "../../context/language-context";
import "./Settings.css";

export const Settings = () => {
  return (
    <LanguageProvider>
      <main className="settings-container">
        <Navbar />
        <div className="settings-content">
          <h1>Configurações da conta</h1>
        </div>
        <ChatAssistant />
      </main>
    </LanguageProvider>
  );
};
