import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import stuartLogo from "../img/logo-stuart.png";

function decodificarJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erro ao decodificar o token JWT:", error);
    return null;
  }
}

export default function Login() {
  const isMobile = window.innerWidth <= 768;
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [tipoLogin, setTipoLogin] = useState<"admin" | "vendedor">("admin");

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (loading) return;

  setError(null);
  setLoading(true);

  const perfilSelecionado = tipoLogin;

  try {
    const dados = await login({
      email: email.trim(),
      senha,
    });

    const perfil = String(dados.perfil).trim().toLowerCase();

    if (perfil !== perfilSelecionado) {
      logout();

      throw new Error(
        perfilSelecionado === "admin"
          ? "Este usuário não tem privilégios de Administrador."
          : "Este usuário não tem privilégios de Vendedor."
      );
    }

    navigate(
      perfil === "admin" ? "/dashboard" : "/vendas",
      { replace: true }
    );
  } catch (err: unknown) {
    const erro = err as {
      message?: string;
      response?: {
        status?: number;
        data?: {
          message?: string;
          title?: string;
        };
      };
    };

    if (erro.response?.status === 401) {
      setError("E-mail ou senha incorretos.");
    } else if (erro.response) {
      setError(
        erro.response.data?.message ||
        erro.response.data?.title ||
        "Não foi possível realizar o login."
      );
    } else if (erro.message === "Network Error") {
      setError("Não foi possível conectar à API.");
    } else {
      setError(erro.message || "Não foi possível realizar o login.");
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="login-page-container">

      {!isMobile && (
      <div className="login-banner" style={{
        flex: "0 0 35%",
        maxWidth: "480px",
        minWidth: "320px",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        boxShadow: "4px 0 15px rgba(0,0,0,0.1)",
        zIndex: 10
      }}>
        <img
          src={stuartLogo}
          alt="Stuart Conceito"
          style={{ width: "100%", maxWidth: "260px", height: "auto", marginBottom: "25px" }}
        />
        <div style={{ height: "2px", width: "40px", backgroundColor: "#3b82f6", marginBottom: "20px" }}></div>
        <p style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "400", letterSpacing: "3px", textAlign: "center" }}>
        </p>
      </div>
      )}
      <div className="login-form-area" style={{
        flex: "1",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#1e293b", textAlign: "center" }}>
            Acessar Conta
          </h2>
          <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "15px", textAlign: "center" }}>
            Selecione seu perfil e informe suas credenciais.
          </p>

          <div style={{
            display: "flex", backgroundColor: "#e2e8f0", borderRadius: "10px",
            padding: "4px", marginBottom: "30px"
          }}>
            <button
              type="button"
              onClick={() => { setTipoLogin("admin"); setError(null); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "8px", border: "none",
                backgroundColor: tipoLogin === "admin" ? "#ffffff" : "transparent",
                color: tipoLogin === "admin" ? "#0f172a" : "#64748b",
                fontWeight: "600", fontSize: "14px", cursor: "pointer",
                boxShadow: tipoLogin === "admin" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => { setTipoLogin("vendedor"); setError(null); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "8px", border: "none",
                backgroundColor: tipoLogin === "vendedor" ? "#ffffff" : "transparent",
                color: tipoLogin === "vendedor" ? "#0f172a" : "#64748b",
                fontWeight: "600", fontSize: "14px", cursor: "pointer",
                boxShadow: tipoLogin === "vendedor" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              Vendedor
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>E-MAIL</label>
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "14px", borderRadius: "8px",
                  border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
                  fontSize: "15px", color: "#1e293b",
                  outline: "none", transition: "border-color 0.2s"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>SENHA</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 45px 14px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "15px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",  top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "15px", marginTop: "10px",
                backgroundColor: tipoLogin === "admin" ? "#2563eb" : "#7e22ce",
                color: "#ffffff", border: "none", borderRadius: "8px",
                fontSize: "16px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: tipoLogin === "admin" ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "0 4px 12px rgba(126, 34, 206, 0.2)",
                transition: "background-color 0.3s ease"
              }}
            >
              {loading ? "Autenticando..." : `Entrar como ${tipoLogin === "admin" ? "Administrador" : "Vendedor"}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
