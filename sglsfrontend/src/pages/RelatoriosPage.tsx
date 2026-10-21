import { useEffect, useState } from "react";
import { api } from "../services/api";

interface PedidoRelatorio {
  id: string;
  dataPedido?: string;
  dataCriacao?: string;
  valorTotal?: number;
  total?: number;
  status: number | string;
}

interface StatusInfo {
  texto: string;
  bg: string;
  cor: string;
  tipo: "finalizado" | "cancelado" | "aberto" | "desconhecido";
}

interface ResumoRelatorio {
  faturamentoTotal: number;
  qtdPedidos: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
}

function obterPrimeiroDiaDoMes(): string {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}-01`;
}

function obterDataDeHoje(): string {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function extrairListaPedidos(data: unknown): PedidoRelatorio[] {
  if (Array.isArray(data)) {
    return data as PedidoRelatorio[];
  }

  if (data && typeof data === "object") {
    const resposta = data as {
      data?: unknown;
      items?: unknown;
      value?: unknown;
    };

    if (Array.isArray(resposta.data)) {
      return resposta.data as PedidoRelatorio[];
    }

    if (Array.isArray(resposta.items)) {
      return resposta.items as PedidoRelatorio[];
    }

    if (Array.isArray(resposta.value)) {
      return resposta.value as PedidoRelatorio[];
    }
  }

  return [];
}

function getStatusInfo(statusValor: number | string): StatusInfo {
  const status = String(statusValor)
    .trim()
    .toLowerCase();

  if (
    status === "7" ||
    status === "2" ||
    status === "finalizado" ||
    status === "concluido" ||
    status === "concluído"
  ) {
    return {
      texto: "Finalizado",
      bg: "#dcfce7",
      cor: "#15803d",
      tipo: "finalizado"
    };
  }

  if (
    status === "6" ||
    status === "3" ||
    status === "8" ||
    status === "cancelado" ||
    status === "cancelada"
  ) {
    return {
      texto: "Cancelado",
      bg: "#fee2e2",
      cor: "#b91c1c",
      tipo: "cancelado"
    };
  }

  if (
    status === "1" ||
    status === "aberto"
  ) {
    return {
      texto: "Aberto",
      bg: "#fef3c7",
      cor: "#b45309",
      tipo: "aberto"
    };
  }

  return {
    texto: "Desconhecido",
    bg: "#f1f5f9",
    cor: "#64748b",
    tipo: "desconhecido"
  };
}

function obterDataPedido(pedido: PedidoRelatorio): string | undefined {
  return pedido.dataPedido ?? pedido.dataCriacao;
}

function obterValorPedido(pedido: PedidoRelatorio): number {
  return Number(
    pedido.valorTotal ?? pedido.total ?? 0
  );
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);
}

function formatarDataHora(data?: string): string {
  if (!data) {
    return "-";
  }

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleString("pt-BR");
}

function formatarIdPedido(id: string): string {
  const valor = String(id);

  if (/^\d+$/.test(valor)) {
    return `#${valor.padStart(4, "0")}`;
  }

  return `#${valor}`;
}

export default function RelatoriosPage() {
  const [dataInicio, setDataInicio] = useState<string>(
    obterPrimeiroDiaDoMes()
  );

  const [dataFim, setDataFim] = useState<string>(
    obterDataDeHoje()
  );

  const [pedidosFiltrados, setPedidosFiltrados] =
    useState<PedidoRelatorio[]>([]);

  const [loading, setLoading] = useState(false);

  const [resumo, setResumo] = useState<ResumoRelatorio>({
    faturamentoTotal: 0,
    qtdPedidos: 0,
    pedidosConcluidos: 0,
    pedidosCancelados: 0
  });

  async function buscarRelatorio(
    inicio: string = dataInicio,
    fim: string = dataFim
  ) {
    try {
      setLoading(true);

      const response = await api.get("/pedidos");
      const pedidos = extrairListaPedidos(response.data);

      const inicioTimestamp = inicio
        ? new Date(`${inicio}T00:00:00`).getTime()
        : Number.NEGATIVE_INFINITY;

      const fimTimestamp = fim
        ? new Date(`${fim}T23:59:59.999`).getTime()
        : Number.POSITIVE_INFINITY;

      const filtrados = pedidos.filter((pedido) => {
        const dataRaw = obterDataPedido(pedido);

        if (!dataRaw) {
          return false;
        }

        const timestamp = new Date(dataRaw).getTime();

        if (Number.isNaN(timestamp)) {
          return false;
        }

        return (
          timestamp >= inicioTimestamp &&
          timestamp <= fimTimestamp
        );
      });

      const ordenados = [...filtrados].sort(
        (pedidoA, pedidoB) => {
          const dataA = new Date(
            obterDataPedido(pedidoA) || 0
          ).getTime();

          const dataB = new Date(
            obterDataPedido(pedidoB) || 0
          ).getTime();

          return dataB - dataA;
        }
      );

      const novoResumo = ordenados.reduce<ResumoRelatorio>(
        (acumulador, pedido) => {
          const status = getStatusInfo(pedido.status);
          const valor = obterValorPedido(pedido);

          acumulador.qtdPedidos += 1;

          if (status.tipo === "finalizado") {
            acumulador.faturamentoTotal += valor;
            acumulador.pedidosConcluidos += 1;
          }

          if (status.tipo === "cancelado") {
            acumulador.pedidosCancelados += 1;
          }

          return acumulador;
        },
        {
          faturamentoTotal: 0,
          qtdPedidos: 0,
          pedidosConcluidos: 0,
          pedidosCancelados: 0
        }
      );

      setPedidosFiltrados(ordenados);
      setResumo(novoResumo);
    } catch (error) {
      console.error(
        "Erro ao carregar relatório:",
        error
      );

      alert(
        "Falha ao buscar os dados. Verifique a conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void buscarRelatorio(
      obterPrimeiroDiaDoMes(),
      obterDataDeHoje()
    );
  }, []);

  function limparFiltro() {
    const novoInicio = obterPrimeiroDiaDoMes();
    const novoFim = obterDataDeHoje();

    setDataInicio(novoInicio);
    setDataFim(novoFim);

    void buscarRelatorio(novoInicio, novoFim);
  }

  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  };

  const inputDateStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    colorScheme: "light",
    fontFamily: "inherit",
    width: "140px"
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
        paddingBottom: "40px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: 0
            }}
          >
            Relatórios
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: "4px 0 0 0",
              fontSize: "14px"
            }}
          >
            Análise de faturamento por período
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            flexWrap: "wrap"
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "6px"
              }}
            >
              Data Inicial
            </label>

            <input
              type="date"
              value={dataInicio}
              onChange={(event) =>
                setDataInicio(event.target.value)
              }
              style={inputDateStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "6px"
              }}
            >
              Data Final
            </label>

            <input
              type="date"
              value={dataFim}
              onChange={(event) =>
                setDataFim(event.target.value)
              }
              style={inputDateStyle}
            />
          </div>

          <button
            type="button"
            onClick={() => void buscarRelatorio()}
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "0 20px",
              height: "40px",
              borderRadius: "8px",
              cursor: loading ? "wait" : "pointer",
              fontWeight: "600",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.7 : 1
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              style={{ marginTop: "-2px" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              />
            </svg>

            {loading ? "Buscando..." : "Buscar"}
          </button>

          <button
            type="button"
            onClick={limparFiltro}
            disabled={loading}
            title="Limpar"
            style={{
              background: "#f1f5f9",
              color: "#64748b",
              border: "none",
              padding: "0 14px",
              height: "40px",
              borderRadius: "8px",
              cursor: loading ? "wait" : "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.7 : 1
            }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #16a34a"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Faturamento Pago
          </h3>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "32px",
              fontWeight: "800",
              color: "#16a34a"
            }}
          >
            {formatarMoeda(resumo.faturamentoTotal)}
          </p>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #3b82f6"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Total de Pedidos
          </h3>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "32px",
              fontWeight: "800",
              color: "#1e293b"
            }}
          >
            {resumo.qtdPedidos}{" "}
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#94a3b8"
              }}
            >
              movimentações
            </span>
          </p>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #10b981"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Vendas Concluídas
          </h3>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "32px",
              fontWeight: "800",
              color: "#1e293b"
            }}
          >
            {resumo.pedidosConcluidos}{" "}
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#94a3b8"
              }}
            >
              pagas
            </span>
          </p>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #dc2626"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Pedidos Cancelados
          </h3>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "32px",
              fontWeight: "800",
              color: "#dc2626"
            }}
          >
            {resumo.pedidosCancelados}{" "}
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#94a3b8"
              }}
            >
              estornos
            </span>
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b"
            }}
          >
            Listagem do Período
          </h3>

          {loading && (
            <span
              style={{
                color: "#3b82f6",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Buscando...
            </span>
          )}
        </div>

        <div
          className="responsive-table-container"
          style={{
            overflowX: "auto",
            maxHeight: "500px"
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              textAlign: "left"
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2
              }}
            >
              <tr
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0"
                }}
              >
                <th
                  style={{
                    padding: "14px 16px",
                    color: "#64748b",
                    fontWeight: "600"
                  }}
                >
                  Cód. Pedido
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    color: "#64748b",
                    fontWeight: "600"
                  }}
                >
                  Data de Abertura
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    color: "#64748b",
                    fontWeight: "600"
                  }}
                >
                  Status
                </th>

                <th
                  style={{
                    padding: "14px 16px",
                    color: "#64748b",
                    fontWeight: "600",
                    textAlign: "right"
                  }}
                >
                  Valor Registrado
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                pedidosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#94a3b8"
                      }}
                    >
                      Nenhuma movimentação registrada no
                      período selecionado.
                    </td>
                  </tr>
                )}

              {pedidosFiltrados.map((pedido) => {
                const status = getStatusInfo(
                  pedido.status
                );

                const valor = obterValorPedido(pedido);

                return (
                  <tr
                    key={pedido.id}
                    style={{
                      borderBottom:
                        "1px solid #f1f5f9"
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor =
                        "#f8fafc";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        fontWeight: "600",
                        color: "#0f172a"
                      }}
                    >
                      {formatarIdPedido(pedido.id)}
                    </td>

                    <td
                      style={{
                        padding: "16px",
                        color: "#475569"
                      }}
                    >
                      {formatarDataHora(
                        obterDataPedido(pedido)
                      )}
                    </td>

                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          backgroundColor: status.bg,
                          color: status.cor,
                          fontWeight: "600",
                          fontSize: "12px"
                        }}
                      >
                        {status.texto}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: "700",
                        color:
                          status.tipo === "cancelado"
                            ? "#94a3b8"
                            : "#1e293b",
                        textDecoration:
                          status.tipo === "cancelado"
                            ? "line-through"
                            : "none"
                      }}
                    >
                      {formatarMoeda(valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}