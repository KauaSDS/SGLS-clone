import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import loginImage from "../img/Rectangle 19.png";

const PerfilUsuario = {
  Administrador: 1,
  Vendedor: 2,
} as const;

type PerfilUsuario =
  (typeof PerfilUsuario)[keyof typeof PerfilUsuario];

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

interface JwtPayload {
  [key: string]: unknown;
}

interface DadosUsuario {
  perfil: PerfilUsuario | null;
  nome: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function decodificarJwt(token: string): JwtPayload | null {
  try {
    const partes = token.replace(/^Bearer\s+/i, "").split(".");
    const base64Url = partes[1];

    if (!base64Url) {
      return null;
    }

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
            `%${caractere.charCodeAt(0).toString(16).padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function obterValorClaim(
  payload: JwtPayload | null,
  nomes: string[]
): string | undefined {
  if (!payload) {
    return undefined;
  }

  for (const nome of nomes) {
    const valor = payload[nome];

    if (Array.isArray(valor) && valor.length > 0) {
      return String(valor[0]);
    }

    if (typeof valor === "string" || typeof valor === "number") {
      return String(valor);
    }
  }

  return undefined;
}

function obterDadosUsuario(token: string | null): DadosUsuario {
  if (!token) {
    return {
      perfil: null,
      nome: "Usuário",
    };
  }

  const perfilSalvo = (localStorage.getItem("perfil") ?? "")
    .trim()
    .toLowerCase();

  let perfil: PerfilUsuario | null = null;

  if (
    perfilSalvo === "admin" ||
    perfilSalvo === "administrador" ||
    perfilSalvo === "1"
  ) {
    perfil = PerfilUsuario.Administrador;
  } else if (
    perfilSalvo === "vendedor" ||
    perfilSalvo === "2"
  ) {
    perfil = PerfilUsuario.Vendedor;
  }

  const payload = decodificarJwt(token);

  const nome = obterValorClaim(payload, [
    "unique_name",
    "name",
    "nome",
    "given_name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  ]);

  const nomePadrao =
    perfil === PerfilUsuario.Administrador
      ? "Admin"
      : perfil === PerfilUsuario.Vendedor
        ? "Vendedor"
        : "Usuário";

  return {
    perfil,
    nome: nome?.trim() || nomePadrao,
  };
}

const dashboardIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z" />
  </svg>
);

const categoriasIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31A2 2 0 0 1 2.826 3h3.982a2 2 0 0 1 1.992 2.181z" />
  </svg>
);

const produtosIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11z" />
    <path d="M2 1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 1 6.586V2a1 1 0 0 1 1-1zm4 3.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z" />
  </svg>
);

const estoqueIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.958l-7.19 2.876a1.5 1.5 0 0 1-1.162 0l-7.19-2.876A1 1 0 0 1 0 12.162V3.5a.5.5 0 0 1 .314-.464z" />
  </svg>
);

const pedidosIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const vendasIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM4.415 11h8.17l1.313-7H3.102L4.415 11z" />
    <path d="M5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const relatoriosIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z" />
  </svg>
);

const funcionariosIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6.936 9.28A5.88 5.88 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
  </svg>
);

const configuracoesIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z" />
  </svg>
);

const navItemsAdministrador: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: dashboardIcon },
  { path: "/categorias", label: "Categorias", icon: categoriasIcon },
  { path: "/produtos", label: "Produtos", icon: produtosIcon },
  { path: "/estoque", label: "Estoque", icon: estoqueIcon },
  { path: "/pedidos", label: "Pedidos", icon: pedidosIcon },
  { path: "/relatorios", label: "Relatórios", icon: relatoriosIcon },
  {
    path: "/funcionarios",
    label: "Funcionários",
    icon: funcionariosIcon,
  },
  {
    path: "/configuracoes",
    label: "Configurações",
    icon: configuracoesIcon,
  },
];

const navItemsVendedor: NavItem[] = [
  { path: "/vendas", label: "Vendas / PDV", icon: vendasIcon },
  { path: "/meus-pedidos", label: "Meus Pedidos", icon: pedidosIcon },
  {
    path: "/configuracoes",
    label: "Configurações",
    icon: configuracoesIcon,
  },
];

export default function Sidebar({
  isOpen = false,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const { token } = useAuth();
  const usuario = obterDadosUsuario(token);

  const isAdmin = usuario.perfil === PerfilUsuario.Administrador;
  const isVendedor = usuario.perfil === PerfilUsuario.Vendedor;

  const navItems = isAdmin
    ? navItemsAdministrador
    : isVendedor
      ? navItemsVendedor
      : [];

  const tituloPerfil = isAdmin
    ? "Admin"
    : isVendedor
      ? "Vendedor"
      : "Usuário";

  const descricaoPerfil = isAdmin
    ? "Administrador"
    : isVendedor
      ? "Vendedor"
      : "Perfil não identificado";

  return (
    <aside
      id="main-sidebar"
      className={`sidebar-container ${isOpen ? "open" : ""}`}
      style={{
        width: "250px",
        backgroundColor: "#f5f7fa",
        color: "#333",
        height: "100vh",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRight: "1px solid #edf2f9",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              color: "#64748b",
              padding: "4px 8px",
              minWidth: "44px",
              minHeight: "44px",
            }}
          >
            ✕
          </button>
        )}

        <h2
          style={{
            fontSize: "12px",
            color: "#1976d2",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Stuart Conceito - {tituloPerfil}
        </h2>

        <div style={{ marginTop: "15px" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "#e3f2fd",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={loginImage}
              alt="Usuário"
              style={{
                width: "90%",
                objectFit: "contain",
              }}
            />
          </div>

          <h3
            style={{
              margin: "10px 0 5px 0",
              fontSize: "16px",
              color: "#000",
            }}
          >
            {usuario.nome}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#666",
            }}
          >
            {descricaoPerfil}
          </p>
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "12px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: isActive ? "bold" : "normal",
                color: isActive ? "#000" : "#666",
                backgroundColor: isActive ? "#e2e8f0" : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  color: isActive ? "#1976d2" : "#888",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {item.icon}
              </div>

              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}