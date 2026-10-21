import { useEffect, useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import loginImage from "../img/Rectangle 19.png";

function decodificarJwt(token: string): Record<string, unknown> | null {
  try {
    const partes = token.replace(/^Bearer\s+/i, "").split(".");
    if (partes.length < 2) return null;
    const base64Url = partes[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(window.atob(base64).split("").map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function usuarioEhAdmin(): boolean {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (!token) return false;
  const payload = decodificarJwt(token);
  const role = String(payload?.["role"] || payload?.["perfil"] || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "").toLowerCase();
  return role === "1" || role === "admin" || role === "administrador";
}

export default function Layout({ children }: { children: JSX.Element }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = usuarioEhAdmin();

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isMobileMenuOpen);

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMobileMenuOpen]);

  // Bottom navigation primary items based on role
  const bottomNavItems = isAdmin
    ? [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/produtos", label: "Produtos", icon: "📦" },
        { path: "/pedidos", label: "Pedidos", icon: "🛒" },
        { path: "/estoque", label: "Estoque", icon: "🏢" }
      ]
    : [
        { path: "/vendas", label: "Vendas / PDV", icon: "🛍️" },
        { path: "/meus-pedidos", label: "Meus Pedidos", icon: "📋" },
        { path: "/configuracoes", label: "Ajustes", icon: "⚙️" }
      ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa", color: "#333", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="mobile-header-title">
          <span style={{ color: "#1976d2", fontWeight: "bold" }}>Stuart Conceito</span>
        </div>

        <div style={{ width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#e3f2fd" }}>
          <img src={loginImage} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </header>

      {/* Drawer Overlay Backdrop */}
      <div
        className={`mobile-drawer-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div className="layout-shell" style={{ display: "flex", minHeight: "calc(100vh - var(--mobile-header-height, 0px))" }}>
        {/* Sidebar Drawer */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Main Content Area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", boxSizing: "border-box", minWidth: 0 }}>
          <div className="layout-main-content" style={{ padding: "20px 30px 30px 30px", overflowY: "auto", flex: 1 }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`mobile-bottom-nav-item ${isMobileMenuOpen ? "active" : ""}`}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: "18px" }}>☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}