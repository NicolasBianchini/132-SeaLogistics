import { Home, Menu, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

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
        >
          <div className="icon-container">
            <Home size={20} />
          </div>
          <span className={`nav-text ${expanded ? "visible" : "hidden"}`}>
            Home
          </span>
        </div>

        <div
          className={`nav-item ${activeItem === "settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <div className="icon-container">
            <Settings size={20} />
          </div>
          <span className={`nav-text ${expanded ? "visible" : "hidden"}`}>
            Configurações
          </span>
        </div>
      </nav>

      <div className="navbar-footer">
        {expanded && <div className="footer-text">© 2024 SeaLogistics</div>}
      </div>
    </div>
  );
};

export default Navbar;
