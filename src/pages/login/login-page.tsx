"use client";
import LanguageSwitcher from "../../components/language-switcher/language-switcher";
import LoginForm from "../../components/login-form/login-form";
import { LanguageProvider } from "../../context/language-context";
import "./login-page.css";

export const LoginPage = () => {
  return (
    <LanguageProvider>
      <main className="login-container">
        <div className="login-card">
          <LoginForm />
          <LanguageSwitcher />
        </div>
      </main>
    </LanguageProvider>
  );
};
