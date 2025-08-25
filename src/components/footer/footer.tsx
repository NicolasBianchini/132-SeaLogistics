import React from "react";
import { Footer as BorderlessFooter } from "borderless";
import "./footer.css";

interface FooterProps {
  theme?: "light" | "dark";
}

export const Footer: React.FC<FooterProps> = ({ theme = "light" }) => {
  return (
    <div className="footer-container">
      <BorderlessFooter
        theme={theme}
        useGradient={false}
      />
    </div>
  );
};

export default Footer;
