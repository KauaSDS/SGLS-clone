export type FiltroStatusPedido =
  | "todos"
  | "ativos"
  | "cancelados";

export interface ProdutoVenda {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagemId?: string;
  ativa?: boolean | string | number;
}

export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
  nome: string;
  precoUnitario: number;
  estoqueDisponivel: number;
}

export interface ItemCriarPedido {
  produtoId: string;
  quantidade: number;
}

export interface CriarPedidoPayload {
  usuarioId: string;
  itens: ItemCriarPedido[];
}

export interface ItemPedidoResposta {
  produtoId: string;
  quantidade: number;
  precoUnitario?: number;
  subtotal?: number;
  nomeProduto?: string;
  produto?: {
    id?: string;
    nome?: string;
  };
}

export interface UsuarioPedidoResumo {
  id?: string;
  nome?: string;
  name?: string;
  email?: string;
}

export interface Pedido {
  id: string;

  dataCriacao?: string;
  dataPedido?: string;

  total?: number;
  valorTotal?: number;
  status: number | string;

  usuarioId?: string;

  vendedorNome?: string;
  usuarioNome?: string;
  usuario?: UsuarioPedidoResumo;

  itens?: ItemPedidoResposta[];
}