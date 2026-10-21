export type StatusFiltro = "todos" | "ativos" | "inativos";

export type TipoMovimentacao = "entrada" | "saida";

export type Ordenacao =
  | "nome-asc"
  | "nome-desc"
  | "preco-asc"
  | "preco-desc"
  | "estoque-asc"
  | "estoque-desc";

export type CampoOrdenacao = "nome" | "preco" | "estoque";

export interface ProdutoEstoque {
  id: string;
  nome: string;
  estoque: number;
  preco?: number;
  categoriaId?: string;
  categoriaNome?: string;
  imagemId?: string;
  ativa?: boolean | string | number;
  descricao?: string;
}

export interface CategoriaEstoque {
  id: string;
  nome: string;
  ativa?: boolean | string | number;
}