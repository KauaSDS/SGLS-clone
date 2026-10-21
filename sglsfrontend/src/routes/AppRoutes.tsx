import {
  type ReactNode
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import PrivateRoute from "./PrivateRoutes";

import Login from "../pages/Login";
import DashboardPage from "../pages/DashboardPage";
import ProdutosPage from "../pages/ProdutosPage";
import Categorias from "../pages/Categorias";
import PedidosPage from "../pages/PedidosPage";
import RelatoriosPage from "../pages/RelatoriosPage";
import FuncionariosPage from "../pages/FuncionariosPage";
import EstoquePage from "../pages/EstoquePage";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import VendasPage from "../pages/VendasPage";

function obterPerfilToken(): string {
  const token = localStorage.getItem("token");

  if (!token) {
    return "";
  }

  return (localStorage.getItem("perfil") ?? "")
    .trim()
    .toLowerCase();
}

function usuarioEhAdmin(): boolean {
  const perfil = obterPerfilToken();

  return (
    perfil === "1" ||
    perfil === "admin" ||
    perfil === "administrador"
  );
}

function InicioPorPerfil() {
  const perfil = obterPerfilToken();

  if (usuarioEhAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (perfil === "vendedor") {
    return <Navigate to="/vendas" replace />;
  }

  return <Navigate to="/login" replace />;
}

function SomenteAdministrador({
  children,
}: {
  children: ReactNode;
}) {
  if (usuarioEhAdmin()) {
    return <>{children}</>;
  }

  return (
    <Navigate
      to={obterPerfilToken() === "vendedor" ? "/vendas" : "/login"}
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <InicioPorPerfil />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <DashboardPage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/vendas"
          element={
            <PrivateRoute>
              <VendasPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/meus-pedidos"
          element={
            <PrivateRoute>
              <PedidosPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/produtos"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <ProdutosPage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/categorias"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <Categorias />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/pedidos"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <PedidosPage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <RelatoriosPage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/funcionarios"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <FuncionariosPage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <SomenteAdministrador>
                <EstoquePage />
              </SomenteAdministrador>
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <PrivateRoute>
              <ConfiguracoesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            <PrivateRoute>
              <InicioPorPerfil />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}