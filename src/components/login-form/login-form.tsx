"use client";
import type React from "react";
import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { createLoginSchema } from "../../schemas/loginSchema";
import { signIn } from "../../services/auth";
import { userForm } from "../../types/user";
import { useLanguage } from "./../../context/language-context";
import ShipIcon from "./../ship-icon/ship-icon";
import "./login-form.css";

export default function LoginForm() {
  const [user, setUser] = useState<userForm>({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const loginSchema = useMemo(() => {
    return createLoginSchema(translations);
  }, [translations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(user);

    if (!result.success) {
      const errors = result.error.format();
      setFormErrors({
        email: errors.email?._errors[0],
        password: errors.password?._errors[0],
      });
      return;
    }

    setFormErrors({});

    try {
      await signIn(user.email, user.password);
      console.log("Usuario logado com sucesso");

      navigate("/home");
    } catch (err) {
      console.log("Erro ao logar:", err);
    }

    console.log("Login attempt with:", result.data);
  };

  return (
    <div className="login-form-container">
      <div className="logo-container">
        <ShipIcon />
        <h1>Sea Logistics</h1>
      </div>
      <h2>{translations.welcomeMessage}</h2>
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <div className="form-group">
          <label htmlFor="email">{translations.email}</label>
          <input
            id="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            placeholder={translations.emailPlaceholder}
            required
          />
          {formErrors.email && <p className="error-text">{formErrors.email}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="password">{translations.password}</label>
          <input
            type="password"
            id="password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            placeholder={translations.passwordPlaceholder}
            required
          />
          {formErrors.password && (
            <p className="error-text">{formErrors.password}</p>
          )}
        </div>

        <button type="submit" className="login-button">
          {translations.loginButton}
        </button>
      </form>
      <div className="register-link">
        {translations.dontHaveAccount}
        <a
          className="register-link-button"
          onClick={() => navigate("/register")}
        >
          {" "}
          {translations.registerLink}
        </a>
      </div>
    </div>
  );
}
