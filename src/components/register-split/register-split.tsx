"use client";

import type React from "react";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/language-context";
import { createRegisterSchema } from "../../schemas/registerSchema";
import { userCredentials } from "../../types/user";
import { db } from "../../lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import LanguageSwitcher from "../language-switcher/language-switcher";
import ShipIcon from "./../ship-icon/ship-icon";
import "./register-split.css";

export default function RegisterSplit() {
  const [userCredentials, setUserCredentials] = useState<userCredentials>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { translations } = useLanguage();
  const navigate = useNavigate();
  const registerSchema = useMemo(
    () => createRegisterSchema(translations),
    [translations]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, confirmPassword } = userCredentials;

    console.log(userCredentials);

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    const result = registerSchema.safeParse(userCredentials);
    if (!result.success) {
      const errors = result.error.format();
      setFormErrors({
        name: errors.name?._errors[0],
        email: errors.email?._errors[0],
        password: errors.password?._errors[0],
        confirmPassword: errors.confirmPassword?._errors[0],
      });
      return;
    }

    setFormErrors({});

    try {
      // Simulação de cadastro sem Firebase Auth
      console.log("Dados do usuário:", { name, email });

      // Simular delay de cadastro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gerar ID único simples para demonstração
      const userId = `user_${Date.now()}`;

      // Salvar dados do usuário no Firestore
      await setDoc(doc(db, "users", userId), {
        name: name ?? "",
        email,
        createdAt: new Date(),
      });

      // Salvar dados do usuário logado no localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        email,
        name: name ?? "Usuário",
        id: userId
      }));

      console.log("Usuário cadastrado com sucesso");
      navigate("/home");
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
      alert("Erro ao cadastrar. Verifique os dados e tente novamente.");
    }
  };

  return (
    <div className="split-card">
      <div className="split-branding">
        <div className="split-branding-content">
          <div className="split-logo">
            <ShipIcon />
          </div>
          <h1 className="split-logo-text">Sea Logistics</h1>
          <p className="split-description">{translations.registerText}</p>
        </div>
      </div>

      <div className="split-form-container">
        <h2 className="split-title">{translations.createAccount}</h2>

        <form onSubmit={handleSubmit} className="split-form" noValidate>
          <div className="split-form-group">
            <label htmlFor="name">{translations.name}</label>
            <input
              id="name"
              value={userCredentials.name}
              onChange={(e) =>
                setUserCredentials({ ...userCredentials, name: e.target.value })
              }
              placeholder={translations.namePlaceholder}
              required
            />
            {formErrors.name && <p className="error-text">{formErrors.name}</p>}
          </div>

          <div className="split-form-group">
            <label htmlFor="email">{translations.email}</label>
            <input
              id="email"
              type="email"
              value={userCredentials.email}
              onChange={(e) =>
                setUserCredentials({
                  ...userCredentials,
                  email: e.target.value,
                })
              }
              placeholder={translations.emailPlaceholder}
              required
            />
            {formErrors.email && (
              <p className="error-text">{formErrors.email}</p>
            )}
          </div>

          <div className="split-password-grid">
            <div className="split-form-group">
              <label htmlFor="password">{translations.password}</label>
              <input
                id="password"
                type="password"
                value={userCredentials.password}
                onChange={(e) =>
                  setUserCredentials({
                    ...userCredentials,
                    password: e.target.value,
                  })
                }
                placeholder={translations.passwordPlaceholder}
                required
              />
              {formErrors.password && (
                <p className="error-text">{formErrors.password}</p>
              )}
            </div>

            <div className="split-form-group">
              <label htmlFor="confirm-password">
                {translations.confirmPassword}
              </label>
              <input
                id="confirm-password"
                type="password"
                value={userCredentials.confirmPassword}
                onChange={(e) =>
                  setUserCredentials({
                    ...userCredentials,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder={translations.confirmPasswordPlaceholder}
                required
              />
              {formErrors.confirmPassword && (
                <p className="error-text">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="split-button">
            {translations.registerButton}
          </button>
        </form>

        <div className="split-login-link">
          {translations.alreadyHaveAccount}{" "}
          <a onClick={() => navigate("/")} className="split-link">
            {translations.loginLink}
          </a>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
