import { api } from "./api";

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
  };
  imagemId?: string; 
}

export const produtoService = {
  async listar(): Promise<Produto[]> {
    const response = await api.get("/produtos");
    return response.data;
  },

  async obter(id: number): Promise<Produto> {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },

  async criar(data: Partial<Produto>): Promise<Produto> {
    const response = await api.post("/produtos", data);
    return response.data;
  },

  async atualizar(id: number, data: Partial<Produto>): Promise<Produto> {
    const response = await api.put(`/produtos/${id}`, data);
    return response.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/produtos/${id}`);
  },

  async uploadImagem(produtoId: string | number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("OwnerId", produtoId.toString());
    formData.append("ImageTypeId", "2"); 

    await api.post("/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
};