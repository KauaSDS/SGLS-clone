export interface LoginRequest {
  email: string
  senha: string
}

export interface AuthResponse {
  token: string
  perfil: string
  expiracao: string
}