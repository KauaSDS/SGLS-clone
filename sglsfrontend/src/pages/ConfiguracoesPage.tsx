import { useEffect, useState } from "react";
import { api } from "../services/api";

interface JwtPayload {
  [key: string]: unknown;
}

interface UsuarioResponse {
  id?: string;
  nome?: string;
  email?: string;
  perfil?: number | string;
}

interface PerfilUsuario {
  nome: string;
  email: string;
  cargo: string;
}

function decodificarJwt(token: string): JwtPayload | null {
  try {
    const partes = token.split(".");

    if (partes.length < 2) {
      return null;
    }

    const base64Url = partes[1];

    const base64 = base64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        base64Url.length + ((4 - (base64Url.length % 4)) % 4),
        "="
      );

    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(
          (caractere) =>
            `%${`00${caractere
              .charCodeAt(0)
              .toString(16)}`.slice(-2)}`
        )
        .join("")
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error(
      "Erro ao decodificar o token JWT:",
      error
    );

    return null;
  }
}

function obterClaim(
  payload: JwtPayload,
  nomes: string[]
): string | undefined {
  for (const nome of nomes) {
    const valor = payload[nome];

    if (
      typeof valor === "string" &&
      valor.trim()
    ) {
      return valor;
    }

    if (
      typeof valor === "number"
    ) {
      return String(valor);
    }
  }

  return undefined;
}

function formatarCargo(
  perfil: string | number | undefined
): string {
  const valor = String(perfil ?? "")
    .trim()
    .toLowerCase();

  if (
    valor === "1" ||
    valor === "admin" ||
    valor === "administrador"
  ) {
    return "Administrador";
  }

  if (
    valor === "2" ||
    valor === "vendedor"
  ) {
    return "Vendedor";
  }

  return "Usuário";
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState<PerfilUsuario>({
    nome: "Carregando...",
    email: "Carregando...",
    cargo: "Carregando..."
  });

  useEffect(() => {
    async function carregarPerfil() {
      const token = localStorage.getItem("token");

      if (!token) {
        setPerfil({
          nome: "Usuário não identificado",
          email: "Não informado",
          cargo: "Usuário"
        });

        return;
      }

      const dadosToken = decodificarJwt(token);

      if (!dadosToken) {
        setPerfil({
          nome: "Usuário não identificado",
          email: "Não informado",
          cargo: "Usuário"
        });

        return;
      }

      const usuarioId = obterClaim(dadosToken, [
        "nameid",
        "sub",
        "id",
        "usuarioId",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]);

      const nomeToken = obterClaim(dadosToken, [
        "unique_name",
        "name",
        "nome",
        "given_name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ]);

      const emailToken = obterClaim(dadosToken, [
        "email",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ]);

      const perfilToken = obterClaim(dadosToken, [
        "role",
        "perfil",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ]);

      setPerfil({
        nome: nomeToken || "Carregando...",
        email: emailToken || "Não informado",
        cargo: formatarCargo(perfilToken)
      });

      if (!usuarioId) {
        setPerfil((perfilAtual) => ({
          ...perfilAtual,
          nome:
            nomeToken ||
            "Nome não disponível no token"
        }));

        console.warn(
          "O token não possui uma claim com o ID do usuário."
        );

        return;
      }

      try {
        const response = await api.get<UsuarioResponse>(
          `/usuarios/${usuarioId}`
        );

        const usuario = response.data;

        setPerfil({
          nome:
            usuario.nome ||
            nomeToken ||
            "Usuário",
          email:
            usuario.email ||
            emailToken ||
            "Não informado",
          cargo: formatarCargo(
            usuario.perfil ?? perfilToken
          )
        });
      } catch (error) {
        console.error(
          "Erro ao buscar os dados do usuário:",
          error
        );

        setPerfil({
          nome:
            nomeToken ||
            "Não foi possível carregar o nome",
          email:
            emailToken ||
            "Não informado",
          cargo: formatarCargo(perfilToken)
        });
      }
    }

    void carregarPerfil();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    backgroundColor: "#f8fafc",
    outline: "none",
    boxSizing: "border-box" as const,
    color: "#475569"
  };

  return (
    <div
      style={{
        fontFamily:
          "'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
        paddingBottom: "60px",
        maxWidth: "1000px"
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e293b",
            margin: "0 0 8px 0"
          }}
        >
          Configurações
        </h2>

        <p
          style={{
            color: "#64748b",
            margin: 0,
            fontSize: "15px"
          }}
        >
          Visualização dos dados cadastrais da sua conta.
        </p>
      </div>

      <div style={cardStyle}>
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20 21v-2a4 4 0 00-3-3.87m-7 0a4 4 0 00-3 3.87v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
          </svg>

          Perfil
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}
        >
          <div
            style={{
              gridColumn: "1 / -1"
            }}
          >
            <label style={labelStyle}>
              Nome Completo
            </label>

            <input
              style={inputStyle}
              value={perfil.nome}
              disabled
            />
          </div>

          <div>
            <label style={labelStyle}>
              E-mail
            </label>

            <input
              style={inputStyle}
              value={perfil.email}
              disabled
            />
          </div>

          <div>
            <label style={labelStyle}>
              Cargo / Função
            </label>

            <input
              style={inputStyle}
              value={perfil.cargo}
              disabled
            />
          </div>
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          border: "1px solid #fee2e2",
          backgroundColor: "#fff5f5"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#991b1b"
              }}
            >
              Sair da Conta
            </h3>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow:
                "0 4px 6px rgba(220, 38, 38, 0.2)"
            }}
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}