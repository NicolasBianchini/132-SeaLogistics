"use client";

import type React from "react";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/language-context";
import { createRegisterSchema } from "../../schemas/registerSchema";
import { userCredentials, UserRole } from "../../types/user";
import { db } from "../../lib/firebaseConfig";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import LanguageSwitcher from "../language-switcher/language-switcher";
import ShipIcon from "./../ship-icon/ship-icon";
import "./register-split.css";

export default function RegisterSplit() {
  const [userCredentials, setUserCredentials] = useState<userCredentials>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyCode: "",
    role: UserRole.COMPANY_USER,
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    companyName?: string;
    companyCode?: string;
  }>({});
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const { translations } = useLanguage();
  const navigate = useNavigate();
  const registerSchema = useMemo(
    () => createRegisterSchema(translations),
    [translations]
  );

  const findOrCreateCompany = async (companyName: string, companyCode: string) => {
    try {
      // Verificar se a empresa já existe pelo código
      const companiesQuery = query(
        collection(db, 'companies'),
        where('code', '==', companyCode)
      );

      const querySnapshot = await getDocs(companiesQuery);

      if (!querySnapshot.empty) {
        // Empresa já existe
        const companyDoc = querySnapshot.docs[0];
        return companyDoc.id;
      } else {
        // Criar nova empresa
        const companyId = `company_${Date.now()}`;
        await setDoc(doc(db, 'companies', companyId), {
          id: companyId,
          name: companyName,
          code: companyCode,
          contactEmail: userCredentials.email,
          isActive: true,
          createdAt: new Date(),
        });
        return companyId;
      }
    } catch (error) {
      console.error('Error finding/creating company:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, confirmPassword, companyName, companyCode, role } = userCredentials;

    console.log(userCredentials);

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    // Validação específica para usuários de empresa
    if (role === UserRole.COMPANY_USER) {
      if (!companyName || !companyCode) {
        alert("Nome da empresa e código são obrigatórios para usuários de empresa.");
        return;
      }
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
      // Gerar ID único simples para demonstração
      const userId = `user_${Date.now()}`;
      let companyId: string | undefined;

      // Se for usuário de empresa, criar/encontrar empresa
      if (role === UserRole.COMPANY_USER && companyName && companyCode) {
        companyId = await findOrCreateCompany(companyName, companyCode);
      }

      // Preparar dados do usuário baseado no role
      const baseUserData = {
        uid: userId,
        displayName: name ?? "",
        email,
        role,
        isActive: true,
        createdAt: new Date(),
      };

      // Adicionar campos específicos para usuários de empresa
      const userData = role === UserRole.COMPANY_USER
        ? {
          ...baseUserData,
          companyId,
          companyName,
        }
        : baseUserData;

      // Salvar dados do usuário no Firestore
      await setDoc(doc(db, "users", userId), userData);

      // Salvar dados do usuário logado no localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        email,
        name: name ?? "Usuário",
        id: userId,
        role
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

        {/* Seletor de tipo de usuário */}
        <div className="split-form-group">
          <label>Tipo de Usuário</label>
          <div className="user-type-selector">
            <label className="radio-option">
              <input
                type="radio"
                name="userType"
                checked={!isCreatingAdmin}
                onChange={() => {
                  setIsCreatingAdmin(false);
                  setUserCredentials({ ...userCredentials, role: UserRole.COMPANY_USER });
                }}
              />
              Usuário de Empresa
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="userType"
                checked={isCreatingAdmin}
                onChange={() => {
                  setIsCreatingAdmin(true);
                  setUserCredentials({ ...userCredentials, role: UserRole.ADMIN });
                }}
              />
              Administrador
            </label>
          </div>
        </div>

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

          {/* Campos de empresa (apenas para usuários de empresa) */}
          {!isCreatingAdmin && (
            <>
              <div className="split-form-group">
                <label htmlFor="companyName">Nome da Empresa</label>
                <input
                  id="companyName"
                  value={userCredentials.companyName}
                  onChange={(e) =>
                    setUserCredentials({
                      ...userCredentials,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Digite o nome da sua empresa"
                  required={!isCreatingAdmin}
                />
                {formErrors.companyName && (
                  <p className="error-text">{formErrors.companyName}</p>
                )}
              </div>

              <div className="split-form-group">
                <label htmlFor="companyCode">Código da Empresa</label>
                <input
                  id="companyCode"
                  value={userCredentials.companyCode}
                  onChange={(e) =>
                    setUserCredentials({
                      ...userCredentials,
                      companyCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ex: LOG001"
                  required={!isCreatingAdmin}
                />
                <small>Código único para identificar sua empresa</small>
                {formErrors.companyCode && (
                  <p className="error-text">{formErrors.companyCode}</p>
                )}
              </div>
            </>
          )}

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
