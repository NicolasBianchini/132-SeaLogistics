"use client";

import { Bot, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./chat-assistant.css";

interface Message {
  id: number;
  text: string;
  sender: string;
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message when opening for the first time
      setTimeout(() => {
        setMessages([
          {
            id: Date.now(),
            text: "Olá! Sou o assistente virtual da SeaLogistics. Como posso ajudar você hoje?",
            sender: "bot",
          },
        ]);
      }, 500);
    }
  };

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateResponse = () => {
    const responses = [
      "Entendi! Vou verificar essa informação para você.",
      "Obrigado pela sua mensagem. Posso ajudar com mais alguma coisa?",
      "A SeaLogistics oferece diversos serviços de logística marítima. Gostaria de saber mais sobre algum serviço específico?",
      "Estou processando sua solicitação. Em breve teremos uma resposta para você.",
      "Isso é interessante! Vamos analisar as melhores opções para sua necessidade.",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    setIsTyping(true);

    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          text: randomResponse,
          sender: "bot",
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");

    simulateResponse();
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-assistant-container">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <Bot size={20} />
              <span>Assistente SeaLogistics</span>
            </div>
            <button
              className="close-button"
              onClick={toggleChat}
              aria-label="Fechar chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <span className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              aria-label="Mensagem"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={inputValue.trim() === ""}
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          className="chat-button"
          onClick={toggleChat}
          aria-label="Abrir chat"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
