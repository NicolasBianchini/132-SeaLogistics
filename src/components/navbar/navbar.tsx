import { Home, Menu, Settings, X, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fecha o menu sempre que a rota muda
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  const getActiveItem = () => {
    if (location.pathname.includes("settings")) return "settings";
    if (location.pathname.includes("novo-envio")) return "novo-envio";
    return "home";
  };

  const activeItem = getActiveItem();

  return (
    <div className={`navbar ${expanded ? "expanded" : "collapsed"}`}>
      <div className="navbar-header">
        <button
          className="toggle-btn"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse menu" : "Expand menu"}
        >
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="company-logo">
          <div className={`company-name ${expanded ? "visible" : "hidden"}`}>
            <span className="company-name-text">SeaLogistics</span>
          </div>
        </div>
      </div>

      <nav className="nav-items">
        <div
          className={`nav-item ${activeItem === "home" ? "active" : ""}`}
          onClick={() => navigate("/home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate("/home")}
        >
          <div className="icon-container">
            <Home size={20} />
          </div>
          <span className={`nav-text ${expanded ? "visible" : "hidden"}`}>
            Home
          </span>
        </div>

        <div
          className={`nav-item ${activeItem === "novo-envio" ? "active" : ""}`}
          onClick={() => navigate("/novo-envio")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate("/novo-envio")}
        >
          <div className="icon-container">
            <Plus size={20} />
          </div>
          <span className={`nav-text ${expanded ? "visible" : "hidden"}`}>
            Novo Envio
          </span>
        </div>

        <div
          className={`nav-item ${activeItem === "settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate("/settings")}
        >
          <div className="icon-container">
            <Settings size={20} />
          </div>
          <span className={`nav-text ${expanded ? "visible" : "hidden"}`}>
            Configurações
          </span>
        </div>
      </nav>

      {expanded && (
        <div className="navbar-footer">
          <span>SeaLogistics © 2024</span>
        </div>
      )}
    </div>
  );
};

export default Navbar;
