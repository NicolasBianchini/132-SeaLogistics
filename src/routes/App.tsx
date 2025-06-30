import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { HomePage as Home } from "../pages/home/home-page";
import { EnviosPage } from "../pages/envios/envios-page";
import { LoginPage as Login } from "../pages/login/login-page";
import { RegisterPage as Register } from "../pages/register/register-page";
import { Settings } from "../pages/settings/Settings";
import NovoEnvioPage from "../pages/novo-envio/novo-envio";
import { ShipmentsProvider } from "../context/shipments-context";
import { AuthProvider } from "../context/auth-context";
import { NavbarProvider } from "../components/navbar/navbar-provider";

export const App = () => {
    return (
        <AuthProvider>
            <ShipmentsProvider>
                <NavbarProvider>
                    <Router>
                        <Routes>
                            <Route path="/" element={<Login />} />
                            <Route path="/register" element={<Register />} />
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