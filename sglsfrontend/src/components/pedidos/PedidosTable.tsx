import type { Pedido } from "../../types/pedido";
import {
  formatarData,
  formatarMoeda,
  formatarPedidoId,
  obterDataPedido,
  obterQuantidadeItens,
  obterStatusPedido,
  obterValorPedido,
  pedidoEstaCancelado
} from "./pedidoUtils";

interface PedidosTableProps {
  pedidos: Pedido[];
  podeCancelar: boolean;
  cancelandoId: string | null;
  onDetalhes: (pedido: Pedido) => void;
  onCancelar: (pedido: Pedido) => void;
}

export default function PedidosTable({
  pedidos,
  podeCancelar,
  cancelandoId,
  onDetalhes,
  onCancelar
}: PedidosTableProps) {
  return (
    <section className="pedidos-tabela-card">
      <div className="pedidos-tabela-topo">
        <div>
          <h3>Histórico de pedidos</h3>

          <p>
            {pedidos.length} pedido(s) encontrado(s)
          </p>
        </div>
      </div>

      <div className="pedidos-tabela-container responsive-table-container">
        <table className="pedidos-tabela">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>

              <th className="pedidos-coluna-acoes">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((pedido) => {
              const status = obterStatusPedido(
                pedido.status
              );

              const podeCancelarPedido =
                podeCancelar &&
                !pedidoEstaCancelado(pedido);

              return (
                <tr key={pedido.id}>
                  <td>
                    <strong className="pedidos-id">
                      {formatarPedidoId(pedido.id)}
                    </strong>
                  </td>

                  <td>
                    {formatarData(
                      obterDataPedido(pedido)
                    )}
                  </td>

                  <td>
                    {obterQuantidadeItens(pedido)} un.
                  </td>

                  <td>
                    <strong>
                      {formatarMoeda(
                        obterValorPedido(pedido)
                      )}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={`pedidos-status ${status.classe}`}
                    >
                      {status.texto}
                    </span>
                  </td>

                  <td>
                    <div className="pedidos-acoes">
                      <button
                        type="button"
                        className="pedidos-btn-icone visualizar"
                        onClick={() =>
                          onDetalhes(pedido)
                        }
                        title="Ver detalhes"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      </button>

                      {podeCancelarPedido && (
                        <button
                          type="button"
                          className="pedidos-btn-icone cancelar"
                          onClick={() =>
                            onCancelar(pedido)
                          }
                          disabled={
                            cancelandoId === pedido.id
                          }
                          title={
                            cancelandoId === pedido.id
                              ? "Cancelando pedido..."
                              : "Cancelar pedido"
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                            />

                            <path d="m9 9 6 6M15 9l-6 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {pedidos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="pedidos-tabela-vazia"
                >
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}