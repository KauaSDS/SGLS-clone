import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../services/api";

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  preco?: number;
  estoque?: number;
  categoriaId?: string;
  ativa?: boolean | string | number;
}

interface Pedido {
  id: string;
  status: number | string;
  valorTotal?: number;
  total?: number;
  dataPedido?: string;
  dataCriacao?: string;
}

interface DadoSemanal {
  dia: string;
  data: string;
  valor: number;
}

interface CategoriaDestaque {
  categoria: Categoria;
  quantidade: number;
  percentual: number;
}

interface StatusInfo {
  texto: string;
  bg: string;
  cor: string;
  tipo: "finalizado" | "cancelado" | "desconhecido";
}

const DIAS_SEMANA = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom"
];

function extrairLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const resposta = data as {
      data?: unknown;
      items?: unknown;
      value?: unknown;
    };

    if (Array.isArray(resposta.data)) {
      return resposta.data as T[];
    }

    if (Array.isArray(resposta.items)) {
      return resposta.items as T[];
    }

    if (Array.isArray(resposta.value)) {
      return resposta.value as T[];
    }
  }

  return [];
}

function produtoAtivo(valor: unknown): boolean {
  return !(
    valor === false ||
    valor === 0 ||
    valor === "0" ||
    valor === "false" ||
    valor === "inativo"
  );
}

function obterStatusInfo(
  statusValor: number | string
): StatusInfo {
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

  return {
    texto: "Desconhecido",
    bg: "#f1f5f9",
    cor: "#64748b",
    tipo: "desconhecido"
  };
}

function obterDataPedido(
  pedido: Pedido
): Date | null {
  const dataRaw =
    pedido.dataPedido ?? pedido.dataCriacao;

  if (!dataRaw) {
    return null;
  }

  const data = new Date(dataRaw);

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function obterValorPedido(pedido: Pedido): number {
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

function formatarPedidoId(id: string): string {
  const valor = String(id);

  if (/^\d+$/.test(valor)) {
    return `#${valor.padStart(4, "0")}`;
  }

  return `#${valor.slice(0, 8).toUpperCase()}`;
}

function obterInicioDaSemana(dataReferencia = new Date()): Date {
  const inicio = new Date(dataReferencia);

  const diasDesdeSegunda =
    (inicio.getDay() + 6) % 7;

  inicio.setDate(
    inicio.getDate() - diasDesdeSegunda
  );

  inicio.setHours(0, 0, 0, 0);

  return inicio;
}

function obterFimDaSemana(dataReferencia = new Date()): Date {
  const fim = obterInicioDaSemana(dataReferencia);

  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  return fim;
}

function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(data);
}

function formatarDataCompleta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(data);
}

function obterPeriodoSemana(
  dataReferencia = new Date()
): string {
  const inicio = obterInicioDaSemana(dataReferencia);
  const fim = obterFimDaSemana(dataReferencia);

  return `${formatarDataCompleta(inicio)} a ${formatarDataCompleta(fim)}`;
}

function criarDadosSemanais(
  dataReferencia = new Date()
): DadoSemanal[] {
  const inicio = obterInicioDaSemana(dataReferencia);

  return DIAS_SEMANA.map((dia, indice) => {
    const data = new Date(inicio);

    data.setDate(inicio.getDate() + indice);

    return {
      dia,
      data: formatarDataCurta(data),
      valor: 0
    };
  });
}

function montarVendasDaSemana(
  pedidos: Pedido[]
): DadoSemanal[] {
  const dados = criarDadosSemanais();

  const inicioSemana = obterInicioDaSemana();
  const fimSemana = obterFimDaSemana();

  pedidos.forEach((pedido) => {
    const status = obterStatusInfo(pedido.status);
    if (status.tipo !== "finalizado") {
      return;
    }

    const dataPedido = obterDataPedido(pedido);

    if (
      !dataPedido ||
      dataPedido < inicioSemana ||
      dataPedido > fimSemana
    ) {
      return;
    }

    const indiceDia =
      (dataPedido.getDay() + 6) % 7;

    dados[indiceDia].valor +=
      obterValorPedido(pedido);
  });

  return dados;
}

export default function DashboardPage() {
  const location = useLocation();

  const [totalProdutos, setTotalProdutos] =
    useState<number | null>(null);

  const [totalCategorias, setTotalCategorias] =
    useState<number | null>(null);

  const [totalPedidos, setTotalPedidos] =
    useState<number | null>(null);

  const [estoqueBaixo, setEstoqueBaixo] =
    useState<number | null>(null);

  const [ultimosPedidos, setUltimosPedidos] =
    useState<Pedido[]>([]);

  const [produtosDestaque, setProdutosDestaque] =
    useState<Produto[]>([]);

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [todosProdutos, setTodosProdutos] =
    useState<Produto[]>([]);

  const [dadosSemanais, setDadosSemanais] =
    useState<DadoSemanal[]>(
      criarDadosSemanais()
    );

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function loadStats() {
    try {
      setLoading(true);
      setErro("");

      const [
        categoriasResponse,
        pedidosResponse,
        produtosResponse
      ] = await Promise.all([
        api.get("/categorias"),
        api.get("/pedidos"),
        api.get("/produtos")
      ]);

      const categoriasCarregadas =
        extrairLista<Categoria>(
          categoriasResponse.data
        ).map((categoria) => ({
          ...categoria,
          id: String(categoria.id)
        }));

      const pedidosCarregados =
        extrairLista<Pedido>(
          pedidosResponse.data
        ).map((pedido) => ({
          ...pedido,
          id: String(pedido.id)
        }));

      const produtosCarregados =
        extrairLista<Produto>(
          produtosResponse.data
        ).map((produto) => ({
          ...produto,
          id: String(produto.id),
          categoriaId: produto.categoriaId
            ? String(produto.categoriaId)
            : undefined,
          estoque: Number(produto.estoque) || 0,
          preco: Number(produto.preco) || 0
        }));

      setCategorias(categoriasCarregadas);
      setTotalCategorias(
        categoriasCarregadas.length
      );

      const pedidosOrdenados = [
        ...pedidosCarregados
      ].sort((pedidoA, pedidoB) => {
        const dataA =
          obterDataPedido(pedidoA)?.getTime() ?? 0;

        const dataB =
          obterDataPedido(pedidoB)?.getTime() ?? 0;

        return dataB - dataA;
      });

      setTotalPedidos(pedidosOrdenados.length);
      setUltimosPedidos(
        pedidosOrdenados.slice(0, 4)
      );

      setDadosSemanais(
        montarVendasDaSemana(pedidosCarregados)
      );

      setTodosProdutos(produtosCarregados);
      setTotalProdutos(produtosCarregados.length);

      setEstoqueBaixo(
        produtosCarregados.filter(
          (produto) =>
            produtoAtivo(produto.ativa) &&
            (Number(produto.estoque) || 0) <= 5
        ).length
      );

      setProdutosDestaque(
        [...produtosCarregados]
          .sort(
            (produtoA, produtoB) =>
              (Number(produtoB.estoque) || 0) -
              (Number(produtoA.estoque) || 0)
          )
          .slice(0, 5)
      );
    } catch (error) {
      console.error(
        "Erro ao carregar o dashboard:",
        error
      );

      setErro(
        "Não foi possível carregar os dados do dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, [location.pathname]);

  const maiorVendaSemanal = useMemo(
    () =>
      Math.max(
        ...dadosSemanais.map(
          (item) => item.valor
        ),
        0
      ),
    [dadosSemanais]
  );

  const possuiVendaNaSemana =
    maiorVendaSemanal > 0;

  const periodoSemana = useMemo(
    () => obterPeriodoSemana(),
    [location.pathname]
  );

  const categoriasDestaque =
    useMemo<CategoriaDestaque[]>(() => {
      return categorias
        .map((categoria) => {
          const quantidade = todosProdutos.filter(
            (produto) =>
              String(produto.categoriaId) ===
              String(categoria.id)
          ).length;

          const percentual =
            totalProdutos && totalProdutos > 0
              ? (quantidade / totalProdutos) * 100
              : 0;

          return {
            categoria,
            quantidade,
            percentual
          };
        })
        .filter((item) => item.quantidade > 0)
        .sort(
          (itemA, itemB) =>
            itemB.quantidade - itemA.quantidade
        )
        .slice(0, 5);
    }, [categorias, todosProdutos, totalProdutos]);

  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    border: "1px solid #e2e8f0"
  };

  return (
    <div
      style={{
        fontFamily:
          "'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
        paddingBottom: "40px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
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
            Visão Geral
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "14px"
            }}
          >
          Principais informações da loja
          </p>
        </div>

        {loading && (
          <span
            style={{
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            Atualizando...
          </span>
        )}
      </div>

      {erro && (
        <div
          style={{
            padding: "13px 15px",
            marginBottom: "20px",
            border: "1px solid #fecaca",
            borderRadius: "9px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          {erro}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px"
        }}
      >
        <div
          style={{
            backgroundColor: "#388e3c",
            padding: "24px",
            borderRadius: "16px",
            color: "white",
            boxShadow:
              "0 10px 15px -3px rgba(56, 142, 60, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                opacity: 0.9
              }}
            >
              Total Produtos
            </h3>

            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "36px",
                fontWeight: "800"
              }}
            >
              {totalProdutos ?? "..."}
            </p>
          </div>

          <div
            style={{
              backgroundColor:
                "rgba(255, 255, 255, 0.2)",
              padding: "12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line
                x1="12"
                y1="22.08"
                x2="12"
                y2="12"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#1976d2",
            padding: "24px",
            borderRadius: "16px",
            color: "white",
            boxShadow:
              "0 10px 15px -3px rgba(25, 118, 210, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                opacity: 0.9
              }}
            >
              Total Categorias
            </h3>

            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "36px",
                fontWeight: "800"
              }}
            >
              {totalCategorias ?? "..."}
            </p>
          </div>

          <div
            style={{
              backgroundColor:
                "rgba(255, 255, 255, 0.2)",
              padding: "12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f57c00",
            padding: "24px",
            borderRadius: "16px",
            color: "white",
            boxShadow:
              "0 10px 15px -3px rgba(245, 124, 0, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                opacity: 0.9
              }}
            >
              Total Pedidos
            </h3>

            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "36px",
                fontWeight: "800"
              }}
            >
              {totalPedidos ?? "..."}
            </p>
          </div>

          <div
            style={{
              backgroundColor:
                "rgba(255, 255, 255, 0.2)",
              padding: "12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#dc2626",
            padding: "24px",
            borderRadius: "16px",
            color: "white",
            boxShadow:
              "0 10px 15px -3px rgba(220, 38, 38, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                opacity: 0.9
              }}
            >
              Estoque Baixo
            </h3>

            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "36px",
                fontWeight: "800"
              }}
            >
              {estoqueBaixo ?? "..."}
            </p>
          </div>

          <div
            style={{
              backgroundColor:
                "rgba(255, 255, 255, 0.2)",
              padding: "12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line
                x1="12"
                y1="9"
                x2="12"
                y2="13"
              />
              <line
                x1="12"
                y1="17"
                x2="12.01"
                y2="17"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "24px"
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              marginBottom: "24px"
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1e293b"
                }}
              >
                Vendas da Semana
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                Semana: {periodoSemana}
              </p>
            </div>

            <strong
              style={{
                color: "#2563eb",
                fontSize: "14px"
              }}
            >
              {formatarMoeda(
                dadosSemanais.reduce(
                  (total, item) =>
                    total + item.valor,
                  0
                )
              )}
            </strong>
          </div>

          <div
            style={{
              height: "225px",
              display: "flex",
              alignItems: "stretch",
              gap: "12px"
            }}
          >
            {dadosSemanais.map((item) => {
              const altura =
                maiorVendaSemanal > 0
                  ? Math.max(
                      (item.valor /
                        maiorVendaSemanal) *
                        155,
                      item.valor > 0 ? 10 : 2
                    )
                  : 2;

              return (
                <div
                  key={item.dia}
                  style={{
                    minWidth: 0,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <div
                    style={{
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "10px",
                        fontWeight: "700",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.valor > 0
                        ? formatarMoeda(item.valor)
                        : ""}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "160px",
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      borderBottom:
                        "1px solid #e2e8f0"
                    }}
                  >
                    <div
                      title={`${item.dia}: ${formatarMoeda(
                        item.valor
                      )}`}
                      style={{
                        width: "38px",
                        maxWidth: "75%",
                        height: `${altura}px`,
                        background:
                          item.valor > 0
                            ? "linear-gradient(180deg, #60a5fa, #2563eb)"
                            : "#e2e8f0",
                        borderRadius:
                          "7px 7px 2px 2px",
                        transition:
                          "height 0.5s ease"
                      }}
                    />
                  </div>

                  <span
                    style={{
                      marginTop: "9px",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    {item.dia}
                  </span>

                  <span
                    style={{
                      marginTop: "2px",
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}
                  >
                    {item.data}
                  </span>
                </div>
              );
            })}
          </div>

          {!possuiVendaNaSemana && (
            <p
              style={{
                margin: "4px 0 0",
                color: "#94a3b8",
                fontSize: "12px",
                textAlign: "center"
              }}
            >
              Nenhuma venda finalizada nesta semana.
            </p>
          )}
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
              Últimos Pedidos
            </h3>

            <Link
              to="/pedidos"
              style={{
                fontSize: "13px",
                color: "#3b82f6",
                fontWeight: "500",
                textDecoration: "none"
              }}
            >
              Ver todos
            </Link>
          </div>

          <div className="responsive-table-container" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                textAlign: "left"
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom:
                      "1px solid #e2e8f0"
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      color: "#64748b"
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      padding: "12px",
                      color: "#64748b"
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: "12px",
                      color: "#64748b",
                      textAlign: "right"
                    }}
                  >
                    Valor
                  </th>
                </tr>
              </thead>

              <tbody>
                {ultimosPedidos.map((pedido) => {
                  const status =
                    obterStatusInfo(pedido.status);

                  return (
                    <tr
                      key={pedido.id}
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9"
                      }}
                    >
                      <td
                        style={{
                          padding: "14px",
                          fontWeight: "500",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {formatarPedidoId(pedido.id)}
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            padding: "5px 9px",
                            borderRadius: "999px",
                            backgroundColor: status.bg,
                            color: status.cor,
                            fontWeight: "600",
                            fontSize: "11px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {status.texto}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          fontWeight: "600",
                          color:
                            status.tipo ===
                            "cancelado"
                              ? "#94a3b8"
                              : "#1e293b",
                          textDecoration:
                            status.tipo ===
                            "cancelado"
                              ? "line-through"
                              : "none",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {formatarMoeda(
                          obterValorPedido(pedido)
                        )}
                      </td>
                    </tr>
                  );
                })}

                {ultimosPedidos.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        padding: "35px 15px",
                        color: "#94a3b8",
                        textAlign: "center"
                      }}
                    >
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "24px"
        }}
      >
        <div style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b"
            }}
          >
            Principais Itens em Estoque
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {produtosDestaque.map((produto) => (
              <div
                key={produto.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "15px",
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minWidth: 0
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#e2e8f0",
                      padding: "8px",
                      borderRadius: "8px",
                      color: "#64748b",
                      flexShrink: 0
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        color: "#1e293b",
                        fontSize: "14px",
                        fontWeight: "600",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {produto.nome}
                    </div>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px"
                      }}
                    >
                      {Number(produto.estoque) || 0}{" "}
                      unidades disponíveis
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      marginBottom: "2px",
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase"
                    }}
                  >
                    Valor Unitário
                  </div>

                  <div
                    style={{
                      color: "#2563eb",
                      fontSize: "15px",
                      fontWeight: "700"
                    }}
                  >
                    {formatarMoeda(
                      Number(produto.preco) || 0
                    )}
                  </div>
                </div>
              </div>
            ))}

            {produtosDestaque.length === 0 && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b"
                }}
              >
                Nenhum produto cadastrado.
              </p>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b"
            }}
          >
            Distribuição por Categoria
          </h3>

          <div
            style={{
              width: "100%",
              maxHeight: "340px",
              overflowY: "auto",
              paddingRight: "8px"
            }}
          >
            {categoriasDestaque.map(
              (
                {
                  categoria,
                  quantidade,
                  percentual
                },
                categoriaIndex
              ) => {
                const larguraBarra = Math.min(
                  Math.max(percentual, 5),
                  100
                );

                return (
                  <div
                    key={categoria.id}
                    style={{
                      marginBottom: "14px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontWeight: "600"
                      }}
                    >
                      <span>{categoria.nome}</span>

                      <span
                        style={{
                          color: "#64748b"
                        }}
                      >
                        {quantidade} itens
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "3px"
                      }}
                    >
                      <div
                        style={{
                          width: `${larguraBarra}%`,
                          height: "100%",
                          backgroundColor:
                            categoriaIndex % 2 === 0
                              ? "#3b82f6"
                              : "#10b981",
                          borderRadius: "3px",
                          transition:
                            "width 0.8s ease-in-out"
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}

            {categoriasDestaque.length === 0 && (
              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px"
                }}
              >
                Nenhuma categoria cadastrada.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}