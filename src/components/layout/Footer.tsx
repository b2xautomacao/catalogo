
import React from "react";

const version = "v1.0.0"; // Atualize conforme necessário

const Footer = () => (
  <footer className="w-full px-4 py-2 mt-10 md:mt-16 text-xs text-gray-400 flex items-center justify-center bg-transparent">
    <span>
      SaaS Catálogos | Versão {version} &copy; {new Date().getFullYear()} | Todos os direitos reservados.
    </span>
  </footer>
);

export default Footer;
