import { useMemo, useState } from "react";
import type {
  ItemCarrinho,
  ProdutoVenda
} from "../../types/pedido";
import { formatarMoeda } from "./pedidoUtils";

type ProdutoVendaComStatus = ProdutoVenda & {
  ativo?: boolean | string | number;
  ativa?: boolean | string | number;
  Ativo?: boolean | string | number;
  Ativa?: boolean | string | number;
};

interface NovoPedidoModalProps {
  produtos: ProdutoVendaComStatus[];
  usuarioId: string;
  usuarioNome: string;
  salvando: boolean;
  erro: string | null;
  onClose: () => void;
  onFinalizar: (
    itens: ItemCarrinho[]
  ) => Promise<void>;
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
  produto: Partial<ProdutoVendaComStatus>
): boolean {
  return produtoAtivo(
    produto.ativo ??
      produto.ativa ??
      produto.Ativo ??
      produto.Ativa
  );
}

export default function NovoPedidoModal({
  produtos,
  usuarioId,
  usuarioNome,
  salvando,
  erro,
  onClose,
  onFinalizar
}: NovoPedidoModalProps) {
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [carrinho, setCarrinho] =
    useState<ItemCarrinho[]>([]);
  const [erroLocal, setErroLocal] = useState("");

  const produtosDisponiveis = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          obterStatusProduto(produto) &&
          Number(produto.estoque) > 0
      ),
    [produtos]
  );

  const produtoSelecionado =
    produtosDisponiveis.find(
      (produto) => produto.id === produtoId
    );

  const totalPreview = useMemo(
    () =>
      carrinho.reduce(
        (total, item) =>
          total +
          item.precoUnitario * item.quantidade,
        0
      ),
    [carrinho]
  );

  function adicionarProduto() {
    setErroLocal("");

    if (!produtoSelecionado) {
      setErroLocal("Selecione um produto.");
      return;
    }

    if (
      !Number.isInteger(quantidade) ||
      quantidade <= 0
    ) {
      setErroLocal(
        "Informe uma quantidade válida."
      );
      return;
    }

    const estoqueDisponivel =
      Number(produtoSelecionado.estoque) || 0;

    const quantidadeAtual =
      carrinho.find(
        (item) =>
          item.produtoId === produtoSelecionado.id
      )?.quantidade || 0;

    if (
      quantidadeAtual + quantidade >
      estoqueDisponivel
    ) {
      setErroLocal(
        `Estoque insuficiente. Disponível: ${estoqueDisponivel} unidade(s).`
      );
      return;
    }

    setCarrinho((itensAtuais) => {
      const itemExistente = itensAtuais.find(
        (item) =>
          item.produtoId === produtoSelecionado.id
      );

      if (itemExistente) {
        return itensAtuais.map((item) =>
          item.produtoId === produtoSelecionado.id
            ? {
                ...item,
                quantidade:
                  item.quantidade + quantidade
              }
            : item
        );
      }

      return [
        ...itensAtuais,
        {
          produtoId: produtoSelecionado.id,
          quantidade,
          nome: produtoSelecionado.nome,
          precoUnitario:
            Number(produtoSelecionado.preco) || 0,
          estoqueDisponivel
        }
      ];
    });

    setProdutoId("");
    setQuantidade(1);
  }

  function alterarQuantidade(
    produtoIdAlterado: string,
    novaQuantidade: number
  ) {
    const item = carrinho.find(
      (produto) =>
        produto.produtoId === produtoIdAlterado
    );

    if (!item) {
      return;
    }

    if (novaQuantidade <= 0) {
      removerItem(produtoIdAlterado);
      return;
    }

    if (
      novaQuantidade > item.estoqueDisponivel
    ) {
      setErroLocal(
        `Estoque insuficiente. Disponível: ${item.estoqueDisponivel} unidade(s).`
      );
      return;
    }

    setErroLocal("");

    setCarrinho((itensAtuais) =>
      itensAtuais.map((produto) =>
        produto.produtoId === produtoIdAlterado
          ? {
              ...produto,
              quantidade: novaQuantidade
            }
          : produto
      )
    );
  }

  function removerItem(produtoIdRemovido: string) {
    setCarrinho((itensAtuais) =>
      itensAtuais.filter(
        (item) =>
          item.produtoId !== produtoIdRemovido
      )
    );
  }

  async function finalizarVenda() {
    setErroLocal("");

    if (carrinho.length === 0) {
      setErroLocal(
        "Adicione pelo menos um produto ao carrinho."
      );
      return;
    }

    await onFinalizar(carrinho);
  }

  return (
    <div
      className="pedidos-modal-overlay responsive-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="pedidos-modal responsive-modal-content pedidos-modal-venda">
        <header className="pedidos-modal-header">
          <div>
            <h3>Nova venda</h3>
            <p>
              Monte o carrinho e conclua o pedido
            </p>
          </div>

          <button
            type="button"
            className="pedidos-btn-fechar"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="pedidos-modal-body">
          <div className="pedidos-venda-info">
            <div>
              <span>Vendedor</span>
              <strong
                title={`${usuarioNome} — ${usuarioId}`}
              >
                {usuarioNome}
              </strong>
            </div>

            <div>
              <span>Catálogo da venda</span>
              <strong>
                Somente produtos ativos em estoque
              </strong>
            </div>
          </div>

          <section className="pedidos-adicionar-produto">
            <div className="pedidos-campo pedidos-produto-select">
              <label>Produto</label>

              <select
                value={produtoId}
                onChange={(event) =>
                  setProdutoId(event.target.value)
                }
                disabled={
                  salvando ||
                  produtosDisponiveis.length === 0
                }
              >
                <option value="">
                  {produtosDisponiveis.length > 0
                    ? "Selecione um produto..."
                    : "Nenhum produto ativo com estoque"}
                </option>

                {produtosDisponiveis.map(
                  (produto) => (
                    <option
                      key={produto.id}
                      value={produto.id}
                    >
                      {produto.nome} —{" "}
                      {formatarMoeda(produto.preco)} —
                      estoque: {produto.estoque}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="pedidos-campo pedidos-qtd-campo">
              <label>Quantidade</label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(event) =>
                  setQuantidade(
                    Number(event.target.value)
                  )
                }
                disabled={
                  salvando ||
                  produtosDisponiveis.length === 0
                }
              />
            </div>

            <button
              type="button"
              className="pedidos-btn-adicionar"
              onClick={adicionarProduto}
              disabled={
                salvando ||
                produtosDisponiveis.length === 0
              }
            >
              + Adicionar
            </button>
          </section>

          {(erroLocal || erro) && (
            <div className="pedidos-alerta-erro">
              {erroLocal || erro}
            </div>
          )}

          <div className="pedidos-carrinho">
            <div className="pedidos-carrinho-titulo">
              <h4>Itens do carrinho</h4>
              <span>{carrinho.length} produto(s)</span>
            </div>

            <div className="pedidos-carrinho-lista">
              {carrinho.map((item) => (
                <article
                  key={item.produtoId}
                  className="pedidos-carrinho-item"
                >
                  <div className="pedidos-carrinho-produto">
                    <strong>{item.nome}</strong>

                    <span>
                      {formatarMoeda(
                        item.precoUnitario
                      )}{" "}
                      por unidade
                    </span>

                    <small>
                      Estoque exibido:{" "}
                      {item.estoqueDisponivel} un.
                    </small>
                  </div>

                  <div className="pedidos-controle-qtd">
                    <button
                      type="button"
                      onClick={() =>
                        alterarQuantidade(
                          item.produtoId,
                          item.quantidade - 1
                        )
                      }
                      disabled={salvando}
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
                        item.quantidade >=
                          item.estoqueDisponivel
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="pedidos-carrinho-subtotal">
                    <span>Prévia</span>

                    <strong>
                      {formatarMoeda(
                        item.precoUnitario *
                          item.quantidade
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="pedidos-btn-remover"
                    onClick={() =>
                      removerItem(item.produtoId)
                    }
                    disabled={salvando}
                    title="Remover item"
                  >
                    ×
                  </button>
                </article>
              ))}

              {carrinho.length === 0 && (
                <div className="pedidos-carrinho-vazio">
                  O carrinho está vazio.
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="pedidos-modal-footer">
          <div className="pedidos-total-preview">
            <span>Prévia visual</span>
            <strong>
              {formatarMoeda(totalPreview)}
            </strong>
            <small>
              
            </small>
          </div>

          <div className="pedidos-modal-acoes">
            <button
              type="button"
              className="pedidos-btn-secundario"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="pedidos-btn-finalizar"
              onClick={() => void finalizarVenda()}
              disabled={
                salvando || carrinho.length === 0
              }
            >
              {salvando
                ? "Processando..."
                : "Finalizar venda"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}