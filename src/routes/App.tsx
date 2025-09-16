import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { NavbarProvider } from "../components/navbar/navbar-provider";
import { AuthProvider } from "../context/auth-context";
import { LanguageProvider } from "../context/language-context";
import { ShipmentsProvider } from "../context/shipments-context";
import { Footer } from "../components/footer/footer";
import { AdminDashboard } from "../pages/dashboard/admin-dashboard";
import { Dashboard } from "../pages/dashboard/dashboard";
import { EnviosPage } from "../pages/envios/envios-page";
import { HomePage as Home } from "../pages/home/HomePage";
import { LoginPage as Login } from "../pages/login/login-page";
import NovoEnvioPage from "../pages/novo-envio/novo-envio";
import { RegisterPage as Register } from "../pages/register/register-page";
import { Settings } from "../pages/settings/Settings";
import ExcelCallback from "../pages/auth/excel-callback";
import ExcelIntegrationPage from "../pages/excel-integration/excel-integration-page";

export const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ShipmentsProvider>
          <NavbarProvider>
            <Router>
              <div className="app-container">
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/envios" element={<EnviosPage />} />
                  <Route path="/novo-envio" element={<NovoEnvioPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/excel-integration" element={<ExcelIntegrationPage />} />
                  <Route path="/auth/callback" element={<ExcelCallback />} />
                </Routes>
                {/* Footer aparece em todas as páginas autenticadas */}
                <Footer theme="light" />
              </div>
            </Router>
          </NavbarProvider>
        </ShipmentsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};
