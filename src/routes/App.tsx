import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { NavbarProvider } from "../components/navbar/navbar-provider";
import { AuthProvider } from "../context/auth-context";
import { LanguageProvider } from "../context/language-context";
import { ShipmentsProvider } from "../context/shipments-context";
import { AdminDashboard } from "../pages/dashboard/admin-dashboard";
import { Dashboard } from "../pages/dashboard/dashboard";
import { EnviosPage } from "../pages/envios/envios-page";
import { HomePage as Home } from "../pages/home/home-page";
import { LoginPage as Login } from "../pages/login/login-page";
import NovoEnvioPage from "../pages/novo-envio/novo-envio";
import { RegisterPage as Register } from "../pages/register/register-page";
import { Settings } from "../pages/settings/Settings";

export const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ShipmentsProvider>
          <NavbarProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/envios" element={<EnviosPage />} />
                <Route path="/novo-envio" element={<NovoEnvioPage />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Router>
          </NavbarProvider>
        </ShipmentsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};
