
import { createContext, useState, useContext } from "react";
import { api } from "../services/api";
import type { LoginRequest, AuthResponse } from "../types/Auth";

interface AuthContextType {
  token: string | null
  login: (data: LoginRequest) => Promise<AuthResponse>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const isAuthenticated = !!token;

  async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);

  const dados = response.data;

  if (!dados.token || !dados.perfil) {
    throw new Error("A API não retornou o token ou o perfil do usuário.");
  }

  localStorage.setItem("token", dados.token);
  localStorage.setItem("perfil", dados.perfil);
  setToken(dados.token);

  return dados;
}

  function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("perfil");
    setToken(null);

  }

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context)
    throw new Error("useAuth must be used inside AuthProvider");

  return context;

}