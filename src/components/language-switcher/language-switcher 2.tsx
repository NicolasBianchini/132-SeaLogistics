"use client";
import { useLanguage } from "../../context/language-context";
import "./language-switcher.css";

export default function LanguageSwitcher() {
  const { language, setLanguage, translations } = useLanguage();

  return (
    <div className="language-switcher">
      <p>{translations.selectLanguage}:</p>
      <div className="language-buttons">
        <button
          onClick={() => setLanguage("pt")}
          className={language === "pt" ? "active" : ""}
        >
          PT
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={language === "en" ? "active" : ""}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("es")}
          className={language === "es" ? "active" : ""}
        >
          ES
        </button>
      </div>
    </div>
  );
}
