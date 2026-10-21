import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import KpiCard from "../components/estoque/KpiCard";
import ProdutoEstoqueRow from "../components/estoque/ProdutoEstoqueRow";
import MovimentacaoModal from "../components/estoque/MovimentacaoModal";

import type {
  CampoOrdenacao,
  CategoriaEstoque,
  Ordenacao,
  ProdutoEstoque,
  StatusFiltro,
  TipoMovimentacao
} from "../types/estoque";

import "./EstoquePage.css";

type ProdutoEstoqueComStatus = ProdutoEstoque & {
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
};

function IconeProdutos() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

function IconeUnidades() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="m12 2-9 5 9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

function IconeValor() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8.5c-.8-1-2.1-1.5-4-1.5-2.2 0-3.5 1-3.5 2.5 0 3.8 7.5 1.5 7.5 5 0 1.5-1.3 2.5-3.8 2.5-1.9 0-3.4-.6-4.2-1.7M12 5v14" />
    </svg>
  );
}

function IconeAlerta() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M10.3 3.6 2.4 17.3A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.7L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function extrairLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const resposta = data as {
      data?: unknown;
      items?: unknown;
      value?: unknown;
    };

    if (Array.isArray(resposta.data)) return resposta.data as T[];
    if (Array.isArray(resposta.items)) return resposta.items as T[];
    if (Array.isArray(resposta.value)) return resposta.value as T[];
  }

  return [];
}

function produtoAtivo(valor: unknown): boolean {
  if (valor === undefined || valor === null || valor === "") {
    return true;
  }

  const status = String(valor)
    .trim()
    .toLowerCase();

  return !(
    valor === false ||
    valor === 0 ||
    status === "0" ||
    status === "false" ||
    status === "inativo" ||
    status === "inativa"
  );
}

function obterStatusProduto(
  produto: Partial<ProdutoEstoqueComStatus>
): boolean {
  return produtoAtivo(
    produto.ativo ?? produto.ativa
  );
}

function obterMensagemErro(error: unknown, mensagemPadrao: string): string {
  if (error && typeof error === "object") {
    const erro = error as {
      response?: {
        data?: {
          detail?: unknown;
          message?: unknown;
        };
      };
      message?: unknown;
    };

    const mensagem =
      erro.response?.data?.detail ||
      erro.response?.data?.message ||
      erro.message;

    if (typeof mensagem === "string") return mensagem;
  }

  return mensagemPadrao;
}

export default function EstoquePage() {
  const [produtos, setProdutos] =
    useState<ProdutoEstoqueComStatus[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] =
    useState<StatusFiltro>("ativos");
  const [ordenacao, setOrdenacao] =
    useState<Ordenacao>("nome-asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState("");
  const [tipoMovimentacao, setTipoMovimentacao] =
    useState<TipoMovimentacao>("entrada");
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] =
    useState<number | "">("");

  const baseUrl = String(api.defaults.baseURL || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

  const formatarMoeda = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }),
    []
  );

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [produtosResponse, categoriasResponse] = await Promise.all([
        api.get("/produtos"),
        api.get("/categorias")
      ]);

      const produtosCarregados =
        extrairLista<ProdutoEstoqueComStatus>(
          produtosResponse.data
        );
      const categoriasCarregadas =
        extrairLista<CategoriaEstoque>(categoriasResponse.data);

      setProdutos(
        produtosCarregados.map((produto) => {
          const statusAtivo = obterStatusProduto(produto);

          return {
            ...produto,
            id: String(produto.id),
            categoriaId: produto.categoriaId
              ? String(produto.categoriaId)
              : undefined,
            estoque: Number(produto.estoque) || 0,
            preco: Number(produto.preco) || 0,
            ativo: statusAtivo,
            ativa: statusAtivo
          };
        })
      );

      setCategorias(
        categoriasCarregadas.map((categoria) => ({
          ...categoria,
          id: String(categoria.id)
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar o estoque:", error);
      alert(obterMensagemErro(error, "Erro ao carregar os dados de estoque."));
    } finally {
      setLoading(false);
    }
  }

  const categoriasPorId = useMemo(
    () =>
      new Map(
        categorias.map((categoria) => [
          String(categoria.id),
          categoria.nome
        ])
      ),
    [categorias]
  );

  function obterCategoriaNome(
    produto: ProdutoEstoqueComStatus
  ): string {
    if (produto.categoriaNome) return produto.categoriaNome;
    if (!produto.categoriaId) return "Sem categoria";

    return (
      categoriasPorId.get(String(produto.categoriaId)) ||
      "Sem categoria"
    );
  }

  const produtosAtivos = useMemo(
    () =>
      produtos.filter((produto) =>
        obterStatusProduto(produto)
      ),
    [produtos]
  );

  const resumoEstoque = useMemo(() => {
    return produtosAtivos.reduce(
      (resumo, produto) => {
        const estoque = Number(produto.estoque) || 0;
        const preco = Number(produto.preco) || 0;

        resumo.totalProdutosAtivos += 1;
        resumo.totalUnidades += estoque;
        resumo.valorEmEstoque += preco * estoque;

        if (estoque <= 5) resumo.estoqueBaixo += 1;

        return resumo;
      },
      {
        totalProdutosAtivos: 0,
        totalUnidades: 0,
        valorEmEstoque: 0,
        estoqueBaixo: 0
      }
    );
  }, [produtosAtivos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const resultado = produtos.filter((produto) => {
      const categoriaNome = obterCategoriaNome(produto).toLowerCase();
      const ativo = obterStatusProduto(produto);

      const correspondeBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        String(produto.id).toLowerCase().includes(termo) ||
        categoriaNome.includes(termo);

      const correspondeCategoria =
        !categoriaFiltro ||
        String(produto.categoriaId) === categoriaFiltro;

      const correspondeStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "ativos" && ativo) ||
        (statusFiltro === "inativos" && !ativo);

      return (
        correspondeBusca &&
        correspondeCategoria &&
        correspondeStatus
      );
    });

    return resultado.sort((a, b) => {
      switch (ordenacao) {
        case "nome-asc":
          return a.nome.localeCompare(b.nome, "pt-BR");
        case "nome-desc":
          return b.nome.localeCompare(a.nome, "pt-BR");
        case "preco-asc":
          return (Number(a.preco) || 0) - (Number(b.preco) || 0);
        case "preco-desc":
          return (Number(b.preco) || 0) - (Number(a.preco) || 0);
        case "estoque-asc":
          return (Number(a.estoque) || 0) - (Number(b.estoque) || 0);
        case "estoque-desc":
          return (Number(b.estoque) || 0) - (Number(a.estoque) || 0);
        default:
          return 0;
      }
    });
  }, [
    busca,
    categoriaFiltro,
    statusFiltro,
    ordenacao,
    produtos,
    categoriasPorId
  ]);

  const produtoSelecionado = useMemo(
    () =>
      produtos.find(
        (produto) => String(produto.id) === selectedProdutoId
      ),
    [produtos, selectedProdutoId]
  );

  const saldoPrevisto = useMemo(() => {
    if (!produtoSelecionado || quantidadeMovimentacao === "") {
      return null;
    }

    const estoqueAtual = Number(produtoSelecionado.estoque) || 0;
    const quantidade = Number(quantidadeMovimentacao) || 0;

    return tipoMovimentacao === "entrada"
      ? estoqueAtual + quantidade
      : estoqueAtual - quantidade;
  }, [
    produtoSelecionado,
    quantidadeMovimentacao,
    tipoMovimentacao
  ]);

  function alternarOrdenacao(campo: CampoOrdenacao) {
    setOrdenacao((atual) =>
      atual === `${campo}-asc`
        ? (`${campo}-desc` as Ordenacao)
        : (`${campo}-asc` as Ordenacao)
    );
  }

  function obterSetaOrdenacao(campo: CampoOrdenacao) {
    if (!ordenacao.startsWith(campo)) return "↕";
    return ordenacao.endsWith("asc") ? "↑" : "↓";
  }

  function abrirModalMovimentacao(
    produto?: ProdutoEstoque,
    tipo: TipoMovimentacao = "entrada"
  ) {
    setSelectedProdutoId(produto?.id || "");
    setTipoMovimentacao(tipo);
    setQuantidadeMovimentacao("");
    setModalOpen(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalOpen(false);
    setSelectedProdutoId("");
    setTipoMovimentacao("entrada");
    setQuantidadeMovimentacao("");
  }

  async function handleSaveMovimentacao(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!produtoSelecionado) {
      alert("Selecione um produto.");
      return;
    }

    const quantidade = Number(quantidadeMovimentacao) || 0;
    const estoqueAtual = Number(produtoSelecionado.estoque) || 0;

    if (quantidade <= 0) {
      alert("Informe uma quantidade maior que zero.");
      return;
    }

    if (
      tipoMovimentacao === "saida" &&
      quantidade > estoqueAtual
    ) {
      alert(
        `Estoque insuficiente. O produto possui apenas ${estoqueAtual} unidade(s).`
      );
      return;
    }

    const novoEstoque =
      tipoMovimentacao === "entrada"
        ? estoqueAtual + quantidade
        : estoqueAtual - quantidade;

    try {
      setSalvando(true);

      await api.put("/produtos", {
        ...produtoSelecionado,
        id: produtoSelecionado.id,
        categoriaId: produtoSelecionado.categoriaId || null,
        preco: Number(produtoSelecionado.preco) || 0,
        estoque: novoEstoque,
        ativo: obterStatusProduto(produtoSelecionado),
        ativa: undefined
      });

      setProdutos((atuais) =>
        atuais.map((produto) =>
          produto.id === produtoSelecionado.id
            ? { ...produto, estoque: novoEstoque }
            : produto
        )
      );

      setModalOpen(false);
      setSelectedProdutoId("");
      setTipoMovimentacao("entrada");
      setQuantidadeMovimentacao("");

      alert(
        `Movimentação registrada. Novo saldo: ${novoEstoque} unidade(s).`
      );
    } catch (error) {
      console.error("Erro ao atualizar o estoque:", error);
      alert(
        obterMensagemErro(
          error,
          "Erro ao atualizar o estoque do produto."
        )
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="estoque-loading">
        Calculando inventário...
      </div>
    );
  }

  return (
    <div className="estoque-page">
      <header className="estoque-header">
        <div>
          <h2>Estoque</h2>
          <p>Controle de inventário e movimentações de produtos</p>
        </div>

        <button
          type="button"
          className="estoque-btn-principal"
          onClick={() => abrirModalMovimentacao()}
        >
          <span aria-hidden="true">+</span>
          Nova Movimentação
        </button>
      </header>

      <section className="estoque-kpis">
        <KpiCard
          titulo="Produtos ativos"
          valor={resumoEstoque.totalProdutosAtivos}
          subtitulo="Produtos disponíveis para venda"
          icone={<IconeProdutos />}
          cor="verde"
        />

        <KpiCard
          titulo="Unidades em estoque"
          valor={`${resumoEstoque.totalUnidades} un.`}
          subtitulo="Soma das quantidades disponíveis"
          icone={<IconeUnidades />}
          cor="azul"
        />

        <KpiCard
          titulo="Valor em estoque"
          valor={formatarMoeda.format(resumoEstoque.valorEmEstoque)}
          subtitulo="Preço multiplicado pela quantidade"
          icone={<IconeValor />}
          cor="laranja"
        />

        <KpiCard
          titulo="Estoque baixo"
          valor={resumoEstoque.estoqueBaixo}
          subtitulo="Produtos com até 5 unidades"
          icone={<IconeAlerta />}
          cor="vermelho"
        />
      </section>

      <section className="estoque-toolbar">
        <div className="estoque-campo-busca">
          <span aria-hidden="true">⌕</span>

          <input
            type="text"
            className="estoque-input"
            value={busca}
            placeholder="Buscar por produto, categoria ou ID..."
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>

        <select
          className="estoque-select"
          value={categoriaFiltro}
          onChange={(event) =>
            setCategoriaFiltro(event.target.value)
          }
        >
          <option value="">Todas as categorias</option>

          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>

        <select
          className="estoque-select"
          value={statusFiltro}
          onChange={(event) =>
            setStatusFiltro(event.target.value as StatusFiltro)
          }
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Somente ativos</option>
          <option value="inativos">Somente inativos</option>
        </select>

        <select
          className="estoque-select"
          value={ordenacao}
          onChange={(event) =>
            setOrdenacao(event.target.value as Ordenacao)
          }
        >
          <option value="nome-asc">Nome: A até Z</option>
          <option value="nome-desc">Nome: Z até A</option>
          <option value="preco-desc">Maior preço</option>
          <option value="preco-asc">Menor preço</option>
          <option value="estoque-desc">Maior estoque</option>
          <option value="estoque-asc">Menor estoque</option>
        </select>
      </section>

      <section className="estoque-tabela-card">
        <div className="estoque-tabela-topo">
          <div>
            <h3>Produtos em estoque</h3>
            <p>
              {produtosFiltrados.length} produto(s) encontrado(s)
            </p>
          </div>
        </div>

        <div className="estoque-tabela-container">
          <table className="estoque-tabela">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="estoque-btn-ordenacao"
                    onClick={() => alternarOrdenacao("nome")}
                  >
                    Produto {obterSetaOrdenacao("nome")}
                  </button>
                </th>

                <th>Categoria</th>

                <th>
                  <button
                    type="button"
                    className="estoque-btn-ordenacao"
                    onClick={() => alternarOrdenacao("preco")}
                  >
                    Preço {obterSetaOrdenacao("preco")}
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    className="estoque-btn-ordenacao"
                    onClick={() => alternarOrdenacao("estoque")}
                  >
                    Qtd. estoque {obterSetaOrdenacao("estoque")}
                  </button>
                </th>

                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((produto) => (
                <ProdutoEstoqueRow
                  key={produto.id}
                  produto={produto}
                  categoriaNome={obterCategoriaNome(produto)}
                  baseUrl={baseUrl}
                  onMovimentacao={abrirModalMovimentacao}
                />
              ))}

              {produtosFiltrados.length === 0 && (
                <tr>
                  <td className="estoque-vazio" colSpan={6}>
                    Nenhum produto encontrado com os filtros
                    selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <MovimentacaoModal
          produtos={produtosAtivos}
          produtoSelecionado={produtoSelecionado}
          produtoId={selectedProdutoId}
          tipo={tipoMovimentacao}
          quantidade={quantidadeMovimentacao}
          saldoPrevisto={saldoPrevisto}
          salvando={salvando}
          onProdutoChange={setSelectedProdutoId}
          onTipoChange={setTipoMovimentacao}
          onQuantidadeChange={setQuantidadeMovimentacao}
          onClose={fecharModal}
          onSubmit={handleSaveMovimentacao}
        />
      )}
    </div>
  );
}