import { useEffect, useMemo, useState } from "react";
import NovoPedidoModal from "../components/pedidos/NovoPedidoModal";
import PedidoDetalhesModal from "../components/pedidos/PedidoDetalhesModal";
import PedidosTable from "../components/pedidos/PedidosTable";
import { pedidoService } from "../services/pedidoService";
import { produtoService } from "../services/produtoService";
import { api } from "../services/api";
import { pedidoEstaCancelado } from "../components/pedidos/pedidoUtils";

import type {
  CriarPedidoPayload,
  FiltroStatusPedido,
  ItemCarrinho,
  Pedido,
  ProdutoVenda
} from "../types/pedido";

import "./PedidosPage.css";

type ProdutoVendaComStatus = ProdutoVenda & {
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
  Ativo?: boolean | string | number;
  Ativa?: boolean | string | number;
};

interface JwtPayload {
  [key: string]: unknown;
}

function produtoAtivo(valor: unknown): boolean {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
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
  produto: Partial<ProdutoVendaComStatus>
): boolean {
  return produtoAtivo(
    produto.ativo ??
      produto.ativa ??
      produto.Ativo ??
      produto.Ativa
  );
}

function perfilEhAdministrador(
  valor: unknown
): boolean {
  const perfil = String(valor ?? "")
    .trim()
    .toLowerCase();

  return (
    perfil === "administrador" ||
    perfil === "admin" ||
    perfil === "1"
  );
}

function decodificarJwt(
  token: string
): JwtPayload | null {
  try {
    const tokenLimpo = token.replace(
      /^Bearer\s+/i,
      ""
    );

    const payloadBase64 = tokenLimpo.split(".")[1];

    if (!payloadBase64) {
      return null;
    }

    const base64 = payloadBase64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        payloadBase64.length +
          ((4 - (payloadBase64.length % 4)) % 4),
        "="
      );

    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(
          (caractere) =>
            `%${caractere
              .charCodeAt(0)
              .toString(16)
              .padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error(
      "Erro ao decodificar o JWT:",
      error
    );

    return null;
  }
}

function obterClaim(
  payload: JwtPayload | null,
  nomes: string[]
): string | undefined {
  if (!payload) {
    return undefined;
  }

  for (const nome of nomes) {
    const valor = payload[nome];

    if (
      typeof valor === "string" &&
      valor.trim()
    ) {
      return valor;
    }

    if (typeof valor === "number") {
      return String(valor);
    }
  }

  return undefined;
}

function obterToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken")
  );
}

function obterNomeDoToken():
  | string
  | undefined {
  const token = obterToken();

  if (!token) {
    return undefined;
  }

  const payload = decodificarJwt(token);

  return obterClaim(payload, [
    "unique_name",
    "name",
    "nome",
    "given_name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
  ]);
}

function obterPerfilDoToken():
  | string
  | undefined {
  const token = obterToken();

  if (!token) {
    return undefined;
  }

  const payload = decodificarJwt(token);

  return obterClaim(payload, [
    "role",
    "perfil",
    "Perfil",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
  ]);
}

function extrairObjetoUsuario(
  data: unknown
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const resposta = data as {
    data?: unknown;
    value?: unknown;
  };

  if (
    resposta.data &&
    typeof resposta.data === "object"
  ) {
    return resposta.data as Record<
      string,
      unknown
    >;
  }

  if (
    resposta.value &&
    typeof resposta.value === "object"
  ) {
    return resposta.value as Record<
      string,
      unknown
    >;
  }

  return data as Record<string, unknown>;
}

function obterMensagemErro(
  erro: unknown,
  mensagemPadrao: string
): string {
  if (erro && typeof erro === "object") {
    const resposta = erro as {
      response?: {
        data?: {
          detail?: unknown;
          message?: unknown;
          title?: unknown;
          errors?: Record<string, string[]>;
        };
      };
      message?: unknown;
    };

    const data = resposta.response?.data;

    const mensagem =
      data?.detail ||
      data?.message ||
      data?.title ||
      resposta.message;

    if (typeof mensagem === "string") {
      return mensagem;
    }

    if (data?.errors) {
      return Object.values(data.errors)
        .flat()
        .join(" ");
    }
  }

  return mensagemPadrao;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<
    Pedido[]
  >([]);

  const [produtos, setProdutos] = useState<
    ProdutoVendaComStatus[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusPedido>("todos");

  const [novoPedidoOpen, setNovoPedidoOpen] =
    useState(false);

  const [
    pedidoSelecionado,
    setPedidoSelecionado
  ] = useState<Pedido | null>(null);

  const [usuarioId, setUsuarioId] =
    useState("");

  const [usuarioNome, setUsuarioNome] =
    useState("");

  const [
    ehAdministrador,
    setEhAdministrador
  ] = useState(false);

  const [salvandoVenda, setSalvandoVenda] =
    useState(false);

  const [erroVenda, setErroVenda] = useState<
    string | null
  >(null);

  const [cancelandoId, setCancelandoId] =
    useState<string | null>(null);

  const [
    mensagemSucesso,
    setMensagemSucesso
  ] = useState("");

  useEffect(() => {
    void carregarDados();
    void carregarUsuarioLogado();
  }, []);

  async function carregarUsuarioLogado() {
    const id =
      pedidoService.obterUsuarioIdLogado();

    const nomeToken = obterNomeDoToken();
    const perfilToken = obterPerfilDoToken();

    if (nomeToken) {
      setUsuarioNome(nomeToken);
    }

    if (perfilToken !== undefined) {
      setEhAdministrador(
        perfilEhAdministrador(perfilToken)
      );
    }

    if (!id) {
      return;
    }

    setUsuarioId(id);

    try {
      const response = await api.get(
        `/usuarios/${id}`
      );

      const usuario = extrairObjetoUsuario(
        response.data
      );

      const nome =
        usuario?.nome ??
        usuario?.name ??
        usuario?.Nome ??
        usuario?.Name;

      const perfil =
        usuario?.perfil ??
        usuario?.Perfil ??
        usuario?.role ??
        usuario?.Role;

      if (
        typeof nome === "string" &&
        nome.trim()
      ) {
        setUsuarioNome(nome);
      }

      if (perfil !== undefined) {
        setEhAdministrador(
          perfilEhAdministrador(perfil)
        );
      }
    } catch (erro) {
      console.warn(
        "Não foi possível carregar os dados do usuário:",
        erro
      );
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);

      const [pedidosData, produtosData] =
        await Promise.all([
          pedidoService.listar(),
          produtoService.listar()
        ]);

      setPedidos(
        pedidosData.map((pedido) => ({
          ...pedido,
          id: String(pedido.id)
        }))
      );

      const produtosNormalizados = (
        produtosData as unknown as ProdutoVendaComStatus[]
      )
        .map((produto) => {
          const ativo =
            obterStatusProduto(produto);

          return {
            ...produto,
            id: String(produto.id),
            preco:
              Number(produto.preco) || 0,
            estoque:
              Number(produto.estoque) || 0,
            ativo,
            ativa: ativo
          };
        })
        .filter(
          (produto) =>
            obterStatusProduto(produto) &&
            Number(produto.estoque) > 0
        );

      setProdutos(produtosNormalizados);
    } catch (erro) {
      console.error(
        "Erro ao carregar pedidos:",
        erro
      );

      alert(
        obterMensagemErro(
          erro,
          "Erro ao carregar pedidos e produtos."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function abrirNovaVenda() {
    const id =
      pedidoService.obterUsuarioIdLogado();

    if (!id) {
      alert(
        "Não foi possível identificar o usuário logado. Verifique se o token foi salvo corretamente no login."
      );

      return;
    }

    setUsuarioId(id);

    if (!usuarioNome) {
      setUsuarioNome(
        obterNomeDoToken() || "Usuário"
      );

      void carregarUsuarioLogado();
    }

    setErroVenda(null);
    setMensagemSucesso("");
    setNovoPedidoOpen(true);
  }

  async function finalizarVenda(
    itensCarrinho: ItemCarrinho[]
  ) {
    const id =
      pedidoService.obterUsuarioIdLogado() ||
      usuarioId;

    if (!id) {
      setErroVenda(
        "O usuário logado não foi identificado."
      );

      return;
    }

    const payload: CriarPedidoPayload = {
      usuarioId: id,
      itens: itensCarrinho.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    };

    let pedidoIdCriado: string | null = null;

    try {
      setSalvandoVenda(true);
      setErroVenda(null);

      pedidoIdCriado =
        await pedidoService.criar(payload);

      await pedidoService.finalizar(
        pedidoIdCriado
      );

      setNovoPedidoOpen(false);

      setMensagemSucesso(
        "Venda finalizada com sucesso."
      );

      await carregarDados();
    } catch (erro) {
      console.error(
        "Erro ao realizar a venda:",
        erro
      );

      const mensagem = obterMensagemErro(
        erro,
        "Não foi possível realizar a venda."
      );

      setErroVenda(
        pedidoIdCriado
          ? `O pedido foi criado, mas não foi possível finalizá-lo. ${mensagem}`
          : mensagem
      );

      if (pedidoIdCriado) {
        await carregarDados();
      }
    } finally {
      setSalvandoVenda(false);
    }
  }

  async function cancelarPedido(
    pedido: Pedido
  ) {
    if (!ehAdministrador) {
      alert(
        "Apenas administradores podem cancelar pedidos."
      );

      return;
    }

    if (pedidoEstaCancelado(pedido)) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente cancelar o pedido ${pedido.id}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setCancelandoId(pedido.id);

      const pedidoRetornado =
        await pedidoService.cancelar(
          pedido.id
        );

      const statusCancelado =
        pedidoRetornado?.status ??
        "Cancelado";

      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((item) =>
          item.id === pedido.id
            ? {
                ...item,
                ...pedidoRetornado,
                id: item.id,
                status: statusCancelado
              }
            : item
        )
      );

      setPedidoSelecionado(
        (pedidoAtual) =>
          pedidoAtual?.id === pedido.id
            ? {
                ...pedidoAtual,
                ...pedidoRetornado,
                id: pedidoAtual.id,
                status: statusCancelado
              }
            : pedidoAtual
      );

      setMensagemSucesso(
        "Pedido cancelado com sucesso."
      );
    } catch (erro) {
      console.error(
        "Erro ao cancelar o pedido:",
        erro
      );

      alert(
        obterMensagemErro(
          erro,
          "Erro ao cancelar o pedido."
        )
      );
    } finally {
      setCancelandoId(null);
    }
  }

  const pedidosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    return pedidos.filter((pedido) => {
      const correspondeBusca =
        !termo ||
        String(pedido.id)
          .toLowerCase()
          .includes(termo);

      const cancelado =
        pedidoEstaCancelado(pedido);

      const correspondeStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" &&
          !cancelado) ||
        (filtroStatus === "cancelados" &&
          cancelado);

      return (
        correspondeBusca &&
        correspondeStatus
      );
    });
  }, [pedidos, busca, filtroStatus]);

  if (loading) {
    return (
      <div className="pedidos-loading">
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div className="pedidos-page">
      <header className="pedidos-header">
        <div>
          <h2>Pedidos</h2>

          <p>
            Realize vendas e acompanhe os
            pedidos da loja
          </p>
        </div>

        <button
          type="button"
          className="pedidos-btn-principal"
          onClick={abrirNovaVenda}
        >
          <span aria-hidden="true">+</span>
          Nova venda
        </button>
      </header>

      {mensagemSucesso && (
        <div className="pedidos-alerta-sucesso">
          <span>{mensagemSucesso}</span>

          <button
            type="button"
            onClick={() =>
              setMensagemSucesso("")
            }
          >
            ×
          </button>
        </div>
      )}

      <section className="pedidos-toolbar">
        <div className="pedidos-busca">
          <span aria-hidden="true">⌕</span>

          <input
            type="text"
            value={busca}
            placeholder="Buscar pelo ID do pedido..."
            onChange={(event) =>
              setBusca(event.target.value)
            }
          />
        </div>

        <div className="pedidos-filtros">
          {(
            [
              ["todos", "Todos"],
              ["ativos", "Ativos"],
              ["cancelados", "Cancelados"]
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              className={
                filtroStatus === valor
                  ? "ativo"
                  : ""
              }
              onClick={() =>
                setFiltroStatus(valor)
              }
            >
              {texto}
            </button>
          ))}
        </div>
      </section>

      <PedidosTable
        pedidos={pedidosFiltrados}
        podeCancelar={ehAdministrador}
        cancelandoId={cancelandoId}
        onDetalhes={setPedidoSelecionado}
        onCancelar={(pedido) =>
          void cancelarPedido(pedido)
        }
      />

      {novoPedidoOpen && (
        <NovoPedidoModal
          produtos={produtos}
          usuarioId={usuarioId}
          usuarioNome={
            usuarioNome || "Usuário"
          }
          salvando={salvandoVenda}
          erro={erroVenda}
          onClose={() => {
            if (!salvandoVenda) {
              setNovoPedidoOpen(false);
              setErroVenda(null);
            }
          }}
          onFinalizar={finalizarVenda}
        />
      )}

      {pedidoSelecionado && (
        <PedidoDetalhesModal
          pedido={pedidoSelecionado}
          onClose={() =>
            setPedidoSelecionado(null)
          }
        />
      )}
    </div>
  );
}