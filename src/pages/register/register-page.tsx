"use client";
import RegisterSplit from "../../components/register-split/register-split";
import { LanguageProvider } from "../../context/language-context";
import "./register-page.css";

export const RegisterPage = () => {
  return (
    <LanguageProvider>
      <main className="login-container">
        <RegisterSplit />
      </main>
    </LanguageProvider>
  );
};
