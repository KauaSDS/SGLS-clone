import type { Pedido } from "../types/pedido";

interface ItemPedidoDetalhe {
  produtoNome?: string;
  nomeProduto?: string;
  quantidade: number;
  precoUnitario?: number;
  subtotal?: number;
}

type PedidoDetalhado = Pedido & {
  usuarioNome?: string;
  vendedorNome?: string;
  valorTotal?: number;
  total?: number;
  itens?: ItemPedidoDetalhe[];
};

interface PedidoDetalhesProps {
  pedido: PedidoDetalhado;
  onCancelClick: (id: string) => void;
  onClose: () => void;
}

function formatarMoeda(valor?: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);
}

function pedidoCancelado(status: number | string): boolean {
  const valor = String(status)
    .trim()
    .toLowerCase();

  return (
    valor === "6" ||
    valor === "cancelado" ||
    valor === "cancelada"
  );
}

export default function PedidoDetalhes({
  pedido,
  onCancelClick,
  onClose
}: PedidoDetalhesProps) {
  const nomeUsuario =
    pedido.usuarioNome ||
    pedido.vendedorNome ||
    "Não informado";

  const valorTotal =
    Number(pedido.valorTotal ?? pedido.total) || 0;

  const estaCancelado = pedidoCancelado(
    pedido.status
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: "#242424",
          padding: "20px",
          borderRadius: "8px",
          width: "500px",
          maxWidth: "90%",
          color: "white"
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Detalhes do Pedido #{pedido.id}
        </h3>

        <p>
          <strong>Usuário:</strong> {nomeUsuario}
        </p>

        <p>
          <strong>Status:</strong> {pedido.status}
        </p>

        <h4
          style={{
            borderBottom: "1px solid #555",
            paddingBottom: "5px"
          }}
        >
          Itens
        </h4>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px"
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #555" }}>
              <th style={{ textAlign: "left", padding: "5px" }}>
                Produto
              </th>

              <th style={{ textAlign: "left", padding: "5px" }}>
                Qtd
              </th>

              <th style={{ textAlign: "left", padding: "5px" }}>
                Preço
              </th>

              <th style={{ textAlign: "left", padding: "5px" }}>
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody>
            {pedido.itens?.map(
              (
                item: ItemPedidoDetalhe,
                index: number
              ) => {
                const subtotal =
                  item.subtotal ??
                  (Number(item.precoUnitario) || 0) *
                    (Number(item.quantidade) || 0);

                return (
                  <tr key={`${pedido.id}-${index}`}>
                    <td style={{ padding: "5px" }}>
                      {item.produtoNome ||
                        item.nomeProduto ||
                        "Produto"}
                    </td>

                    <td style={{ padding: "5px" }}>
                      {item.quantidade}
                    </td>

                    <td style={{ padding: "5px" }}>
                      {formatarMoeda(
                        item.precoUnitario
                      )}
                    </td>

                    <td style={{ padding: "5px" }}>
                      {formatarMoeda(subtotal)}
                    </td>
                  </tr>
                );
              }
            )}

            {(!pedido.itens ||
              pedido.itens.length === 0) && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "10px"
                  }}
                >
                  Sem itens.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px"
          }}
        >
          <h3 style={{ margin: 0 }}>
            Total: {formatarMoeda(valorTotal)}
          </h3>

          <div
            style={{
              display: "flex",
              gap: "10px"
            }}
          >
            {!estaCancelado && (
              <button
                type="button"
                onClick={() =>
                  onCancelClick(String(pedido.id))
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancelar Pedido
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}