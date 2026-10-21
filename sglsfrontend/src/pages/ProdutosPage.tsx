import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  produtoService,
  type Produto as ProdutoBase
} from "../services/produtoService";
import {
  categoriaService,
  type Categoria as CategoriaBase
} from "../services/categoriaService";

type Produto = Omit<ProdutoBase, "id" | "categoriaId"> & {
  id: string;
  categoriaId?: string;
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
  preco?: number;
  estoque?: number;
  descricao?: string;
  imagemId?: string;
};

type Categoria = Omit<CategoriaBase, "id"> & {
  id: string;
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
};

// Componente auxiliar para carregar a imagem autenticada via token Bearer do Axios
function ProdutoImagem({ imagemId, nomeProduto }: { imagemId?: string; nomeProduto: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imagemId) return;

    let isMounted = true;
    api.get(`/images/${imagemId}/download`, { responseType: "blob" })
      .then((response) => {
        if (isMounted) {
          const url = URL.createObjectURL(response.data);
          setImageUrl(url);
        }
      })
      .catch((err) => console.error("Erro ao carregar imagem:", err));

    return () => {
      isMounted = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imagemId]);

  if (!imageUrl) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          color: "#94a3b8",
          fontSize: "13px"
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block" }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        Carregando imagem...
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Imagem de ${nomeProduto}`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
        padding: "12px",
        boxSizing: "border-box"
      }}
    />
  );
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<"ativas" | "inativas">("ativas");

  const [modalOpen, setModalOpen] = useState(false);
  const [currentProduto, setCurrentProduto] =
    useState<Partial<Produto>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [produtosData, categoriasData] = await Promise.all([
        produtoService.listar(),
        categoriaService.listar()
      ]);

      const produtosNormalizados = (
        produtosData as unknown as Produto[]
      ).map((produto) => {
        const statusAtivo = checkIsAtiva(
          produto.ativo ?? produto.ativa
        );

        return {
          ...produto,
          ativo: statusAtivo,
          ativa: statusAtivo
        };
      });

      const categoriasNormalizadas = (
        categoriasData as unknown as Categoria[]
      ).map((categoria) => {
        const statusAtivo = checkIsAtiva(
          categoria.ativo ?? categoria.ativa
        );

        return {
          ...categoria,
          ativo: statusAtivo,
          ativa: statusAtivo
        };
      });

      setProdutos(produtosNormalizados);
      setCategorias(categoriasNormalizadas);
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);

      alert(
        "Erro ao carregar dados. Verifique sua conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  function checkIsAtiva(valor: unknown): boolean {
    return !(
      valor === false ||
      valor === 0 ||
      valor === "0" ||
      valor === "false"
    );
  }

  function obterStatusProduto(produto: Partial<Produto>): boolean {
    return checkIsAtiva(
      produto.ativo ?? produto.ativa
    );
  }

  function obterStatusCategoria(
    categoria: Partial<Categoria>
  ): boolean {
    return checkIsAtiva(
      categoria.ativo ?? categoria.ativa
    );
  }

  function handleCreate() {
    setIsEditing(false);
    setImageFile(null);

    setCurrentProduto({
      nome: "",
      preco: 0,
      estoque: 0,
      categoriaId: "",
      descricao: "",
      ativo: true,
      ativa: true
    });

    setModalOpen(true);
  }

  function handleEdit(produto: Produto) {
    setIsEditing(true);
    setImageFile(null);
    setCurrentProduto({ ...produto });
    setModalOpen(true);
  }

  async function handleToggleStatus(produto: Produto) {
    const isAtivoAtual = obterStatusProduto(produto);
    const novoStatus = !isAtivoAtual;
    const acao = isAtivoAtual ? "inativar" : "reativar";

    const produtosAnteriores = produtos.map(
      (item) => ({ ...item })
    );

    setProdutos((produtosAtuais) =>
      produtosAtuais.map((item) =>
        item.id === produto.id
          ? {
              ...item,
              ativo: novoStatus,
              ativa: novoStatus
            }
          : item
      )
    );

    try {
      await api.put("/produtos", {
        id: produto.id,
        nome: produto.nome || "",
        descricao: produto.descricao || "",
        preco: Number(produto.preco) || 0,
        estoque: Number(produto.estoque) || 0,
        categoriaId: produto.categoriaId || null,
        ativo: novoStatus
      });
    } catch (error: any) {
      console.error(`Erro ao ${acao} produto:`, error);

      setProdutos(produtosAnteriores);

      const mensagemErro =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        `Ocorreu um erro ao ${acao} o produto.`;

      alert(
        typeof mensagemErro === "string"
          ? mensagemErro
          : "Ocorreu um erro na requisição."
      );
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      const statusAtivoForm = obterStatusProduto(
        currentProduto
      );

      const payload = {
        ...currentProduto,
        imagemId: undefined,
        preco: Number(currentProduto.preco) || 0,
        estoque: Number(currentProduto.estoque) || 0,
        categoriaId: currentProduto.categoriaId || null,
        ativo: statusAtivoForm
      };

      let produtoId: string | undefined = currentProduto.id;

      if (isEditing && currentProduto.id) {
        const response = await api.put("/produtos", payload);

        produtoId =
          currentProduto.id || obterProdutoId(response.data);
      } else {
        const response = await api.post("/produtos", payload);

        produtoId = obterProdutoId(response.data);
      }

      if (imageFile) {
        if (!produtoId) {
          throw new Error(
            "Não foi possível identificar o produto para enviar a imagem."
          );
        }

        await produtoService.uploadImagem(
          produtoId,
          imageFile
        );
      }

      setImageFile(null);
      setModalOpen(false);
      setCurrentProduto({});

      await loadData();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);

      const mensagemErro =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao salvar produto.";

      alert(
        typeof mensagemErro === "string"
          ? mensagemErro
          : "Erro ao salvar produto."
      );
    }
  }

  function obterProdutoId(data: unknown): string | undefined {
    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      const responseData = data as {
        id?: string;
        produtoId?: string;
        data?: {
          id?: string;
          produtoId?: string;
        };
      };

      return (
        responseData.id ||
        responseData.produtoId ||
        responseData.data?.id ||
        responseData.data?.produtoId
      );
    }

    return undefined;
  }

  function getCategoriaNome(id?: string): string {
    if (!id) {
      return "Sem Categoria";
    }

    const categoria = categorias.find(
      (item) => String(item.id) === String(id)
    );

    return categoria?.nome || "Desconhecida";
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const nome = produto.nome || "";

    const correspondeBusca = nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const isAtiva = obterStatusProduto(produto);

    const correspondeStatus =
      filtroStatus === "ativas" ? isAtiva : !isAtiva;

    return correspondeBusca && correspondeStatus;
  });

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          color: "#64748b"
        }}
      >
        Carregando catálogo de produtos...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
        paddingBottom: "40px"
      }}
    >
      <div
        className="page-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "30px",
          gap: "20px"
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0"
            }}
          >
            Produtos
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: 0,
              fontSize: "15px"
            }}
          >
            Gerencie o catálogo e o estoque da sua loja
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="primary-action-btn touch-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: "21px",
              lineHeight: 1
            }}
          >
            +
          </span>

          Novo Produto
        </button>
      </div>

      <div
        className="mobile-filter-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        <div
          className="mobile-search-field"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "400px"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              />
            </svg>
          </div>

          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              color: "#1e293b",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div
          className="segmented-control"
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            padding: "4px",
            borderRadius: "8px"
          }}
        >
          <button
            type="button"
            onClick={() => setFiltroStatus("ativas")}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor:
                filtroStatus === "ativas"
                  ? "#ffffff"
                  : "transparent",
              color:
                filtroStatus === "ativas"
                  ? "#1e293b"
                  : "#64748b",
              boxShadow:
                filtroStatus === "ativas"
                  ? "0 1px 3px rgba(0,0,0,0.1)"
                  : "none"
            }}
          >
            Ativos
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("inativas")}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor:
                filtroStatus === "inativas"
                  ? "#ffffff"
                  : "transparent",
              color:
                filtroStatus === "inativas"
                  ? "#1e293b"
                  : "#64748b",
              boxShadow:
                filtroStatus === "inativas"
                  ? "0 1px 3px rgba(0,0,0,0.1)"
                  : "none"
            }}
          >
            Inativos
          </button>
        </div>
      </div>

      {produtosFiltrados.length > 0 ? (
        <div
          className="products-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            alignItems: "stretch"
          }}
        >
          {produtosFiltrados.map((produto) => {
            const isAtiva = obterStatusProduto(produto);
            const produtoId = String(produto.id || "");
            const estoqueAtual =
              Number(produto.estoque) || 0;

            const semEstoque =
              isAtiva && estoqueAtual <= 0;

            const textoStatus = !isAtiva
              ? "Inativo"
              : semEstoque
                ? "Fora de estoque"
                : "Ativo";

            return (
              <article
                key={produto.id}
                className="product-card"
                style={{
                  backgroundColor: "#ffffff",
                  border: semEstoque
                    ? "1px solid #fecaca"
                    : "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow:
                    "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(-3px)";

                  event.currentTarget.style.boxShadow =
                    "0 12px 24px -8px rgba(15,23,42,0.18)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(0)";

                  event.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)";
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "230px",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {produto.imagemId ? (
                    <ProdutoImagem
                      imagemId={produto.imagemId}
                      nomeProduto={produto.nome || "produto"}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                        color: "#94a3b8",
                        fontSize: "13px"
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="42"
                        height="42"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: "block" }}
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>

                      Sem imagem
                    </div>
                  )}

                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "5px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor: !isAtiva
                        ? "#f1f5f9"
                        : semEstoque
                          ? "#fee2e2"
                          : "#dcfce7",
                      color: !isAtiva
                        ? "#64748b"
                        : semEstoque
                          ? "#dc2626"
                          : "#16a34a",
                      boxShadow:
                        "0 1px 3px rgba(15,23,42,0.12)"
                    }}
                  >
                    {textoStatus}
                  </span>
                </div>

                <div
                  style={{
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1
                  }}
                >
                  <span
                    style={{
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "8px"
                    }}
                  >
                    {getCategoriaNome(produto.categoriaId)}
                  </span>

                  <h3
                    title={produto.nome || "Sem Nome"}
                    style={{
                      margin: "0 0 8px 0",
                      color: "#0f172a",
                      fontSize: "17px",
                      lineHeight: "1.35",
                      fontWeight: "700",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {produto.nome || "Sem Nome"}
                  </h3>

                  <p
                    title={produto.descricao || "Sem descrição"}
                    style={{
                      margin: "0 0 16px 0",
                      color: "#64748b",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      minHeight: "39px",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {produto.descricao || "Sem descrição"}
                  </p>

                  <div style={{ marginTop: "auto" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "14px"
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            color: "#64748b",
                            fontSize: "11px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            marginBottom: "3px"
                          }}
                        >
                          Preço
                        </span>

                        <strong
                          style={{
                            color: "#0f172a",
                            fontSize: "23px",
                            lineHeight: 1,
                            fontWeight: "700"
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              marginRight: "3px"
                            }}
                          >
                            R$
                          </span>

                          {Number(produto.preco || 0)
                            .toFixed(2)
                            .replace(".", ",")}
                        </strong>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "block",
                            color: "#64748b",
                            fontSize: "11px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            marginBottom: "3px"
                          }}
                        >
                          Estoque
                        </span>

                        <strong
                          style={{
                            color: semEstoque
                              ? "#dc2626"
                              : "#334155",
                            fontSize: "14px"
                          }}
                        >
                          {semEstoque
                            ? "Indisponível"
                            : `${estoqueAtual} un.`}
                        </strong>

                        {semEstoque && (
                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "#dc2626",
                              fontSize: "10px",
                              fontWeight: "700",
                              textTransform: "uppercase"
                            }}
                          >
                            0 unidades
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px"
                      }}
                    >
                      <span
                        title={produtoId}
                        style={{
                          color: "#94a3b8",
                          fontSize: "11px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ID: {produtoId.slice(0, 8)}...
                      </span>

                      <div
                        className="product-card-actions"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexShrink: 0
                        }}
                      >
                        {isAtiva && (
                          <button
                            type="button"
                            onClick={() => handleEdit(produto)}
                            title="Editar produto"
                            aria-label={`Editar o produto ${produto.nome}`}
                            style={{
                              width: "38px",
                              height: "34px",
                              minWidth: "38px",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: "8px",
                              cursor: "pointer",
                              color: "#2563eb",
                              overflow: "visible"
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              style={{ display: "block" }}
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void handleToggleStatus(produto)
                          }
                          title={
                            isAtiva
                              ? "Inativar produto"
                              : "Reativar produto"
                          }
                          aria-label={
                            isAtiva
                              ? `Inativar o produto ${produto.nome}`
                              : `Reativar o produto ${produto.nome}`
                          }
                          style={{
                            width: "38px",
                            height: "34px",
                            minWidth: "38px",
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isAtiva
                              ? "#fffbeb"
                              : "#ecfdf5",
                            border: isAtiva
                              ? "1px solid #fde68a"
                              : "1px solid #a7f3d0",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: isAtiva
                              ? "#d97706"
                              : "#059669",
                            overflow: "visible"
                          }}
                        >
                          {isAtiva ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              style={{ display: "block" }}
                            >
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              style={{ display: "block" }}
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "50px 20px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px"
          }}
        >
          Nenhum produto{" "}
          {filtroStatus === "ativas" ? "ativo" : "inativo"}{" "}
          encontrado.
        </div>
      )}

      {modalOpen && (
        <div
          className="responsive-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setImageFile(null);
              setModalOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000
          }}
        >
          <div
            className="responsive-modal-content"
            style={{
              backgroundColor: "#ffffff",
              padding: "30px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "550px",
              color: "#1e293b",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box"
            }}
          >
            <h3
              style={{
                margin: "0 0 24px 0",
                fontSize: "20px",
                fontWeight: "600"
              }}
            >
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#64748b"
                  }}
                >
                  NOME DO PRODUTO *
                </label>

                <input
                  type="text"
                  placeholder="Ex: Camisa Social"
                  value={currentProduto.nome || ""}
                  onChange={(event) =>
                    setCurrentProduto((produtoAtual) => ({
                      ...produtoAtual,
                      nome: event.target.value
                    }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "15px",
                    color: "#000000",
                    backgroundColor: "#f8fafc",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ flex: "1 1 220px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b"
                    }}
                  >
                    CATEGORIA *
                  </label>

                  <select
                    value={currentProduto.categoriaId || ""}
                    onChange={(event) =>
                      setCurrentProduto((produtoAtual) => ({
                        ...produtoAtual,
                        categoriaId: event.target.value
                      }))
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      color: "#000000",
                      backgroundColor: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>

                    {categorias
                      .filter((categoria) =>
                        obterStatusCategoria(categoria)
                      )
                      .map((categoria) => (
                        <option
                          key={categoria.id}
                          value={categoria.id}
                        >
                          {categoria.nome}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ flex: "1 1 180px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b"
                    }}
                  >
                    PREÇO (R$) *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={currentProduto.preco ?? ""}
                    onChange={(event) =>
                      setCurrentProduto((produtoAtual) => ({
                        ...produtoAtual,
                        preco:
                          event.target.value === ""
                            ? undefined
                            : event.target.valueAsNumber
                      }))
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      color: "#000000",
                      backgroundColor: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#64748b"
                  }}
                >
                  ESTOQUE {isEditing ? "" : "*"}
                </label>

                {isEditing ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "15px",
                        color: "#475569",
                        backgroundColor: "#e2e8f0",
                        boxSizing: "border-box",
                        cursor: "not-allowed"
                      }}
                    >
                      {Number(currentProduto.estoque) || 0} unidades
                    </div>

                    <span
                      style={{
                        display: "block",
                        marginTop: "6px",
                        color: "#64748b",
                        fontSize: "12px"
                      }}
                    >
                      A quantidade deve ser alterada na página de estoque.
                    </span>
                  </>
                ) : (
                  <input
                    type="number"
                    min="0"
                    placeholder="Quantidade"
                    value={currentProduto.estoque ?? ""}
                    onChange={(event) =>
                      setCurrentProduto((produtoAtual) => ({
                        ...produtoAtual,
                        estoque:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value)
                      }))
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      color: "#000000",
                      backgroundColor: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#64748b"
                  }}
                >
                  IMAGEM DO PRODUTO (Opcional)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setImageFile(
                      event.target.files?.[0] || null
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "15px",
                    color: "#000000",
                    backgroundColor: "#f8fafc",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "30px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#64748b"
                  }}
                >
                  DESCRIÇÃO (Opcional)
                </label>

                <textarea
                  rows={3}
                  placeholder="Detalhes do produto..."
                  value={currentProduto.descricao || ""}
                  onChange={(event) =>
                    setCurrentProduto((produtoAtual) => ({
                      ...produtoAtual,
                      descricao: event.target.value
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "15px",
                    resize: "vertical",
                    color: "#000000",
                    backgroundColor: "#f8fafc",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div
                className="modal-actions"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "20px"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setModalOpen(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontWeight: "500",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}