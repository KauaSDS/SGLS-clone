import type {
  ItemPedidoResposta,
  Pedido
} from "../../types/pedido";

export interface StatusPedidoInfo {
  texto: string;
  classe: string;
}

export function obterStatusPedido(
  status: number | string
): StatusPedidoInfo {
  const valor = String(status).trim().toLowerCase();

  if (
    valor === "6" ||
    valor === "8" ||
    valor === "cancelado" ||
    valor === "cancelada"
  ) {
    return {
      texto: "Cancelado",
      classe: "cancelado"
    };
  }

  if (
    valor === "7" ||
    valor === "2" ||
    valor === "concluído" ||
    valor === "concluido" ||
    valor === "finalizado"
  ) {
    return {
      texto: "Finalizado",
      classe: "finalizado"
    };
  }

  return {
    texto: "Desconhecido",
    classe: "desconhecido"
  };
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);
}

export function formatarData(data?: string): string {
  if (!data) return "Não informada";

  const valor = new Date(data);

  return Number.isNaN(valor.getTime())
    ? "Não informada"
    : valor.toLocaleDateString("pt-BR");
}

export function obterDataPedido(
  pedido: Pedido
): string | undefined {
  return pedido.dataCriacao ?? pedido.dataPedido;
}

export function formatarPedidoId(id: string): string {
  const valor = String(id);

  if (/^\d+$/.test(valor)) {
    return `#${valor.padStart(4, "0")}`;
  }

  return `#${valor.slice(0, 8).toUpperCase()}`;
}

export function obterQuantidadeItens(
  pedido: Pedido
): number {
  return (pedido.itens || []).reduce(
    (total: number, item: ItemPedidoResposta) =>
      total + (Number(item.quantidade) || 0),
    0
  );
}

export function obterValorPedido(pedido: Pedido): number {
  return Number(
    pedido.total ?? pedido.valorTotal ?? 0
  );
}

export function pedidoEstaCancelado(
  pedido: Pedido
): boolean {
  return (
    obterStatusPedido(pedido.status).classe ===
    "cancelado"
  );
}