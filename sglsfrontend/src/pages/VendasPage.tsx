
import { useEffect, useMemo, useState } from "react";
import { pedidoService } from "../services/pedidoService";
import { api } from "../services/api";
import { produtoService } from "../services/produtoService";
import type {
  CriarPedidoPayload,
  ItemCarrinho,
  ProdutoVenda
} from "../types/pedido";

type ProdutoPdv = ProdutoVenda & {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
  Ativo?: boolean | string | number;
  Ativa?: boolean | string | number;
  descricao?: string;
  Descricao?: string;
  imagemId?: string;
  ImagemId?: string;
  categoriaId?: string;
  CategoriaId?: string;
};

function estaAtivo(valor: unknown): boolean {
  if (valor === undefined || valor === null || valor === "") {
    return true;
  }

  const status = String(valor).trim().toLowerCase();

  return ![
    "false",
    "0",
    "inativo",
    "inativa"
  ].includes(status);
}

function obterStatusProduto(produto: ProdutoPdv): boolean {
  return estaAtivo(
    produto.ativo ??
      produto.ativa ??
      produto.Ativo ??
      produto.Ativa
  );
}

function extrairProdutos(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const resposta = data as Record<string, unknown>;

  for (const chave of [
    "data",
    "items",
    "value",
    "resultados",
    "produtos",
    "Produtos"
  ]) {
    const valor = resposta[chave];

    if (Array.isArray(valor)) {
      return valor as Record<string, unknown>[];
    }

    if (valor && typeof valor === "object") {
      const resultado = extrairProdutos(valor);

      if (resultado.length > 0) {
        return resultado;
      }
    }
  }

  return [];
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function obterMensagemErro(error: unknown): string {
  if (error && typeof error === "object") {
    const resposta = error as {
      response?: {
        data?: {
          detail?: unknown;
          message?: unknown;
          title?: unknown;
        };
      };
      message?: unknown;
    };

    const mensagem =
      resposta.response?.data?.detail ||
      resposta.response?.data?.message ||
      resposta.response?.data?.title ||
      resposta.message;

    if (typeof mensagem === "string") {
      return mensagem;
    }
  }

  return "Não foi possível finalizar a venda.";
}

// Carrega a imagem utilizando o Axios e a autenticação configurada.
function ProdutoImagem({
  imagemId,
  nome
}: {
  imagemId?: string;
  nome: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [erroImagem, setErroImagem] = useState(false);

  useEffect(() => {
    if (!imagemId) {
      setImageUrl(null);
      setErroImagem(false);
      return;
    }

    let ativo = true;
    let urlTemporaria: string | null = null;

    setImageUrl(null);
    setErroImagem(false);

    api
      .get(`/images/${imagemId}/download`, {
        responseType: "blob"
      })
      .then((response) => {
        if (!ativo) return;

        urlTemporaria = URL.createObjectURL(response.data);
        setImageUrl(urlTemporaria);
      })
      .catch((error) => {
        console.error(
          "Erro ao carregar imagem do produto:",
          error
        );

        if (ativo) {
          setErroImagem(true);
        }
      });

    return () => {
      ativo = false;

      if (urlTemporaria) {
        URL.revokeObjectURL(urlTemporaria);
      }
    };
  }, [imagemId]);

  return (
    <div
      style={{
        width: "100%",
        height: "130px",
        marginBottom: "13px",
        borderRadius: "9px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {imageUrl && !erroImagem ? (
        <img
          src={imageUrl}
          alt={`Imagem de ${nome}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            padding: "8px",
            boxSizing: "border-box"
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "7px",
            color: "#94a3b8",
            fontSize: "12px"
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>

          {erroImagem
            ? "Imagem indisponível"
            : imagemId
              ? "Carregando imagem..."
              : "Sem imagem"}
        </div>
      )}
    </div>
  );
}

export default function VendasPage() {
  const [produtos, setProdutos] = useState<ProdutoPdv[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    void carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro("");

      // Utiliza o mesmo serviço da página administrativa.
      const resposta = await produtoService.listar();

      const listaRecebida = extrairProdutos(resposta);

      const produtosNormalizados: ProdutoPdv[] = listaRecebida
        .map((item) => {
          const produto = item as Record<string, unknown>;

          const id =
            produto.id ??
            produto.Id ??
            produto.produtoId ??
            produto.ProdutoId;

          const nome =
            produto.nome ??
            produto.Nome ??
            produto.nomeProduto ??
            produto.NomeProduto;

          const preco =
            produto.preco ??
            produto.Preco ??
            produto.valor ??
            produto.Valor;

          const estoque =
            produto.estoque ??
            produto.Estoque ??
            produto.quantidadeEstoque ??
            produto.QuantidadeEstoque;

          const imagemId =
            produto.imagemId ??
            produto.ImagemId ??
            (
              produto.imagem &&
              typeof produto.imagem === "object"
                ? (produto.imagem as Record<string, unknown>).id
                : undefined
            ) ??
            (
              produto.Imagem &&
              typeof produto.Imagem === "object"
                ? (produto.Imagem as Record<string, unknown>).Id
                : undefined
            );

          const status =
            produto.ativo ??
            produto.ativa ??
            produto.Ativo ??
            produto.Ativa;

          return {
            ...produto,
            id: id == null ? "" : String(id),
            nome: nome == null ? "" : String(nome),
            preco: Number(preco) || 0,
            estoque: Number(estoque) || 0,
            imagemId:
              imagemId == null ? undefined : String(imagemId),
            ativo: status as ProdutoPdv["ativo"],
            ativa: status as ProdutoPdv["ativa"]
          } as ProdutoPdv;
        })
        .filter((produto) => produto.id !== "")
        .filter(obterStatusProduto);

      setProdutos(produtosNormalizados);

      if (produtosNormalizados.length === 0) {
        setErro("Nenhum produto ativo disponível para venda.");
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar produtos:", error);

      setErro(
        obterMensagemErro(error) ===
          "Não foi possível finalizar a venda."
          ? "Não foi possível carregar os produtos. Verifique sua conexão com o servidor."
          : obterMensagemErro(error)
      );
    } finally {
      setLoading(false);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) =>
      (produto.nome || "").toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  const total = useMemo(
    () =>
      carrinho.reduce(
        (acumulado, item) =>
          acumulado + item.precoUnitario * item.quantidade,
        0
      ),
    [carrinho]
  );

  const quantidadeTotal = useMemo(
    () =>
      carrinho.reduce(
        (acumulado, item) => acumulado + item.quantidade,
        0
      ),
    [carrinho]
  );

  function quantidadeNoCarrinho(produtoId: string): number {
    return (
      carrinho.find(
        (item) => item.produtoId === produtoId
      )?.quantidade || 0
    );
  }

  function adicionarProduto(produto: ProdutoPdv) {
    setErro("");
    setSucesso("");

    const estoque = Number(produto.estoque) || 0;
    const quantidadeAtual = quantidadeNoCarrinho(produto.id);

    if (estoque <= 0) {
      setErro("Este produto está sem estoque.");
      return;
    }

    if (quantidadeAtual >= estoque) {
      setErro(
        `O limite disponível de ${produto.nome} já está no carrinho.`
      );
      return;
    }

    setCarrinho((itensAtuais) => {
      const itemExistente = itensAtuais.find(
        (item) => item.produtoId === produto.id
      );

      if (itemExistente) {
        return itensAtuais.map((item) =>
          item.produtoId === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1
              }
            : item
        );
      }

      return [
        ...itensAtuais,
        {
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: 1,
          precoUnitario: Number(produto.preco) || 0,
          estoqueDisponivel: estoque
        }
      ];
    });
  }

  function alterarQuantidade(
    produtoId: string,
    novaQuantidade: number
  ) {
    const item = carrinho.find(
      (produto) => produto.produtoId === produtoId
    );

    if (!item) return;

    if (novaQuantidade <= 0) {
      removerProduto(produtoId);
      return;
    }

    if (novaQuantidade > item.estoqueDisponivel) {
      setErro(
        `O estoque disponível para ${item.nome} é de ${item.estoqueDisponivel} unidade(s).`
      );
      return;
    }

    setErro("");

    setCarrinho((itensAtuais) =>
      itensAtuais.map((produto) =>
        produto.produtoId === produtoId
          ? {
              ...produto,
              quantidade: novaQuantidade
            }
          : produto
      )
    );
  }

  function removerProduto(produtoId: string) {
    setCarrinho((itensAtuais) =>
      itensAtuais.filter(
        (item) => item.produtoId !== produtoId
      )
    );
  }

  async function finalizarVenda() {
    setErro("");
    setSucesso("");

    if (carrinho.length === 0) {
      setErro("Adicione pelo menos um produto ao carrinho.");
      return;
    }

    const usuarioId = pedidoService.obterUsuarioIdLogado();

    if (!usuarioId) {
      setErro(
        "Não foi possível identificar o vendedor logado."
      );
      return;
    }

    const payload: CriarPedidoPayload = {
      usuarioId,
      itens: carrinho.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    };

    let pedidoId: string | null = null;

    try {
      setSalvando(true);

      pedidoId = await pedidoService.criar(payload);

      await pedidoService.finalizar(pedidoId);

      setCarrinho([]);
      setBusca("");
      setSucesso(
        "Venda finalizada com sucesso. O estoque foi atualizado."
      );

      await carregarProdutos();
    } catch (error: unknown) {
      console.error("Erro ao finalizar venda:", error);

      setErro(
        pedidoId
          ? `O pedido ${pedidoId.slice(
              0,
              8
            )} foi criado, mas não pôde ser finalizado. ${obterMensagemErro(error)}`
          : obterMensagemErro(error)
      );
    } finally {
      setSalvando(false);
    }
  }

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    boxShadow: "0 4px 12px rgba(15,23,42,0.05)"
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#64748b" }}>
        Carregando produtos para venda...
      </div>
    );
  }

  return (
    <div
      style={{
        paddingBottom: "40px",
        color: "#0f172a",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "28px",
            color: "#1e293b"
          }}
        >
          Vendas / PDV
        </h2>

        <p style={{ margin: 0, color: "#64748b" }}>
          Busque produtos, monte o carrinho e finalize a venda.
        </p>
      </header>

      {erro && (
        <div
          role="alert"
          style={{
            marginBottom: "16px",
            padding: "12px 15px",
            border: "1px solid #fecaca",
            borderRadius: "9px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c"
          }}
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          style={{
            marginBottom: "16px",
            padding: "12px 15px",
            border: "1px solid #bbf7d0",
            borderRadius: "9px",
            backgroundColor: "#f0fdf4",
            color: "#15803d"
          }}
        >
          {sucesso}
        </div>
      )}

      <div
        className="vendas-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 360px)",
          alignItems: "start",
          gap: "20px"
        }}
      >
        <section
          style={{
            ...cardStyle,
            padding: "20px",
            minWidth: 0
          }}
        >
          <div
            style={{
              position: "relative",
              marginBottom: "18px"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8"
              }}
            >
              ⌕
            </span>

            <input
              autoFocus
              type="text"
              value={busca}
              placeholder="Buscar produto pelo nome..."
              onChange={(event) => setBusca(event.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px 13px 40px",
                border: "1px solid #cbd5e1",
                borderRadius: "9px",
                boxSizing: "border-box",
                fontSize: "15px",
                outline: "none",
                color: "#1e293b",
                backgroundColor: "#ffffff"
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "14px"
            }}
          >
            {produtosFiltrados.map((produto) => {
              const estoque = Number(produto.estoque) || 0;

              const quantidadeAtual = quantidadeNoCarrinho(
                produto.id
              );

              const indisponivel =
                estoque <= 0 || quantidadeAtual >= estoque;

              return (
                <article
                  key={produto.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "11px",
                    backgroundColor:
                      estoque <= 0 ? "#f8fafc" : "#ffffff",
                    opacity: estoque <= 0 ? 0.85 : 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0
                  }}
                >
                  <ProdutoImagem
                    imagemId={produto.imagemId}
                    nome={produto.nome}
                  />

                  <h3
                    title={produto.nome}
                    style={{
                      margin: "0 0 8px",
                      minHeight: "40px",
                      fontSize: "15px",
                      lineHeight: "1.35",
                      color: "#1e293b",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {produto.nome || "Sem nome"}
                  </h3>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "9px",
                      color: "#2563eb",
                      fontSize: "19px"
                    }}
                  >
                    {formatarMoeda(produto.preco)}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginBottom: "13px",
                      color: estoque > 0 ? "#475569" : "#dc2626",
                      fontSize: "13px",
                      fontWeight: "600"
                    }}
                  >
                    {estoque > 0
                      ? `Estoque: ${estoque} un.`
                      : "Sem estoque"}
                  </span>

                  <button
                    type="button"
                    onClick={() => adicionarProduto(produto)}
                    disabled={indisponivel || salvando}
                    style={{
                      width: "100%",
                      marginTop: "auto",
                      padding: "9px 10px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: indisponivel
                        ? "#cbd5e1"
                        : "#2563eb",
                      color: "#ffffff",
                      cursor: indisponivel
                        ? "not-allowed"
                        : "pointer",
                      fontWeight: "700"
                    }}
                  >
                    {estoque <= 0
                      ? "Indisponível"
                      : quantidadeAtual >= estoque
                        ? "Limite no carrinho"
                        : "Adicionar"}
                  </button>
                </article>
              );
            })}

            {produtosFiltrados.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "40px",
                  textAlign: "center",
                  color: "#64748b"
                }}
              >
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </section>

        <aside
          style={{
            ...cardStyle,
            padding: "20px",
            position: "sticky",
            top: "20px",
            minWidth: 0
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              gap: "10px"
            }}
          >
            <h3 style={{ margin: 0, fontSize: "18px" }}>
              Carrinho
            </h3>

            <span style={{ color: "#64748b", fontSize: "13px" }}>
              {quantidadeTotal} item(ns)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "11px",
              marginBottom: "20px"
            }}
          >
            {carrinho.map((item) => (
              <article
                key={item.produtoId}
                style={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "9px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "10px"
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        overflowWrap: "anywhere"
                      }}
                    >
                      {item.nome}
                    </strong>

                    <small style={{ color: "#64748b" }}>
                      {formatarMoeda(item.precoUnitario)} cada
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerProduto(item.produtoId)}
                    disabled={salvando}
                    aria-label={`Remover ${item.nome} do carrinho`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "18px"
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        alterarQuantidade(
                          item.produtoId,
                          item.quantidade - 1
                        )
                      }
                      disabled={salvando}
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>

                    <strong>{item.quantidade}</strong>

                    <button
                      type="button"
                      onClick={() =>
                        alterarQuantidade(
                          item.produtoId,
                          item.quantidade + 1
                        )
                      }
                      disabled={
                        salvando ||
                        item.quantidade >= item.estoqueDisponivel
                      }
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>

                  <strong>
                    {formatarMoeda(
                      item.precoUnitario * item.quantidade
                    )}
                  </strong>
                </div>
              </article>
            ))}

            {carrinho.length === 0 && (
              <div
                style={{
                  padding: "35px 15px",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "9px",
                  color: "#94a3b8",
                  textAlign: "center"
                }}
              >
                O carrinho está vazio.
              </div>
            )}
          </div>

          <div
            style={{
              paddingTop: "16px",
              borderTop: "1px solid #e2e8f0"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "15px"
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontWeight: "600"
                }}
              >
                Total
              </span>

              <strong
                style={{
                  color: "#1e293b",
                  fontSize: "23px"
                }}
              >
                {formatarMoeda(total)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => void finalizarVenda()}
              disabled={salvando || carrinho.length === 0}
              style={{
                width: "100%",
                padding: "13px",
                border: "none",
                borderRadius: "9px",
                backgroundColor:
                  salvando || carrinho.length === 0
                    ? "#94a3b8"
                    : "#16a34a",
                color: "#ffffff",
                fontWeight: "800",
                cursor:
                  salvando || carrinho.length === 0
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              {salvando
                ? "Finalizando..."
                : "Finalizar venda"}
            </button>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .vendas-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .vendas-grid aside {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
