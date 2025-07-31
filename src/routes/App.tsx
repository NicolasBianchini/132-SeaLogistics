import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { NavbarProvider } from "../components/navbar/navbar-provider";
import { AuthProvider } from "../context/auth-context";
import { ShipmentsProvider } from "../context/shipments-context";
import { EnviosPage } from "../pages/envios/envios-page";
import { HomePage as Home } from "../pages/home/home-page";
import { LoginPage as Login } from "../pages/login/login-page";
import NovoEnvioPage from "../pages/novo-envio/novo-envio";
import { RegisterPage as Register } from "../pages/register/register-page";
import { Settings } from "../pages/settings/Settings";

export const App = () => {
  return (
    <AuthProvider>
      <ShipmentsProvider>
        <NavbarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/rregister" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/envios" element={<EnviosPage />} />
              <Route path="/novo-envio" element={<NovoEnvioPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Router>
        </NavbarProvider>
      </ShipmentsProvider>
    </AuthProvider>
  );
};
