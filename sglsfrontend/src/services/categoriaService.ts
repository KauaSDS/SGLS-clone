import { api } from "./api";

export interface Categoria {
  id: string;
  nome: string;
  ativa: boolean;
}

export interface CriarCategoriaRequest {
  nome: string;
  ativa?: boolean;
}

export interface AtualizarCategoriaRequest {
  id: string;
  nome: string;
  ativa: boolean;
}

export const categoriaService = {
  async listar(): Promise<Categoria[]> {
    const response = await api.get<Categoria[]>("/categorias");
    return response.data;
  },

  async obter(id: string): Promise<Categoria> {
    const response = await api.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },

  async criar(data: CriarCategoriaRequest): Promise<Categoria> {
    const response = await api.post<Categoria>("/categorias", {
      nome: data.nome,
      ativa: data.ativa ?? true,
    });

    return response.data;
  },

  async atualizar(data: AtualizarCategoriaRequest): Promise<Categoria> {
    const response = await api.put<Categoria>("/categorias", data);
    return response.data;
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },
};