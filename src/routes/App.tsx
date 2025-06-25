import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { HomePage as Home } from "../pages/home/home-page";
import { LoginPage as Login } from "../pages/login/login-page";
import { RegisterPage as Register } from "../pages/register/register-page";
import { Settings } from "../pages/settings/Settings";
import NovoEnvioPage from "../pages/novo-envio/novo-envio";
import { ShipmentsProvider } from "../context/shipments-context";

export const App = () => {
  return (
    <ShipmentsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/novo-envio" element={<NovoEnvioPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </ShipmentsProvider>
  );
};
