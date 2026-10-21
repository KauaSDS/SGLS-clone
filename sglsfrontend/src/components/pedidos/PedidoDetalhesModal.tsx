import { useEffect, useState } from "react";

import type {
  ItemPedidoResposta,
  Pedido
} from "../../types/pedido";

import {
  usuarioService,
  type UsuarioResumo
} from "../../services/usuarioService";

import {
  formatarData,
  formatarMoeda,
  formatarPedidoId,
  obterDataPedido,
  obterStatusPedido,
  obterValorPedido
} from "./pedidoUtils";

interface PedidoDetalhesModalProps {
  pedido: Pedido;
  onClose: () => void;
}

function obterNomeVendedorDoPedido(
  pedido: Pedido
): string | null {
  const nome =
    pedido.vendedorNome ||
    pedido.usuarioNome ||
    pedido.usuario?.nome ||
    pedido.usuario?.name;

  return nome?.trim() || null;
}

export default function PedidoDetalhesModal({
  pedido,
  onClose
}: PedidoDetalhesModalProps) {
  const status = obterStatusPedido(pedido.status);

  const [vendedor, setVendedor] =
    useState<UsuarioResumo | null>(null);

  const [carregandoVendedor, setCarregandoVendedor] =
    useState(false);

  const [erroVendedor, setErroVendedor] =
    useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarVendedor() {
      const nomeRecebidoNoPedido =
        obterNomeVendedorDoPedido(pedido);

      if (nomeRecebidoNoPedido) {
        setVendedor({
          id: pedido.usuarioId || "",
          nome: nomeRecebidoNoPedido,
          email: pedido.usuario?.email
        });

        return;
      }

      if (!pedido.usuarioId) {
        setErroVendedor(true);
        return;
      }

      try {
        setCarregandoVendedor(true);
        setErroVendedor(false);

        const usuario =
          await usuarioService.obterPorId(
            pedido.usuarioId
          );

        if (componenteAtivo) {
          setVendedor(usuario);
        }
      } catch (error) {
        console.error(
          "Erro ao buscar o vendedor do pedido:",
          error
        );

        if (componenteAtivo) {
          setErroVendedor(true);
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoVendedor(false);
        }
      }
    }

    setVendedor(null);
    setErroVendedor(false);

    void carregarVendedor();

    return () => {
      componenteAtivo = false;
    };
  }, [
    pedido.id,
    pedido.usuarioId,
    pedido.vendedorNome,
    pedido.usuarioNome,
    pedido.usuario
  ]);

  const nomeVendedor = carregandoVendedor
    ? "Carregando..."
    : vendedor?.nome ||
      (erroVendedor
        ? "Não foi possível identificar"
        : "Não informado");

  return (
    <div
      className="pedidos-modal-overlay responsive-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="pedidos-modal responsive-modal-content pedidos-modal-detalhes">
        <header className="pedidos-modal-header">
          <div>
            <h3>
              Pedido {formatarPedidoId(pedido.id)}
            </h3>

            <p>
              Realizado em{" "}
              {formatarData(obterDataPedido(pedido))}
            </p>
          </div>

          <button
            type="button"
            className="pedidos-btn-fechar"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="pedidos-modal-body">
          <div className="pedidos-detalhes-resumo">
            <div>
              <span>Status</span>

              <strong
                className={`pedidos-status ${status.classe}`}
              >
                {status.texto}
              </strong>
            </div>

            <div>
              <span>
                Valor total
              </span>

              <strong>
                {formatarMoeda(
                  obterValorPedido(pedido)
                )}
              </strong>
            </div>

            <div className="pedidos-vendedor-resumo">
              <span>Vendedor</span>

              <strong>{nomeVendedor}</strong>

              {vendedor?.email && (
                <small title={vendedor.email}>
                  {vendedor.email}
                </small>
              )}
            </div>
          </div>

          <h4 className="pedidos-secao-titulo">
            Itens comprados
          </h4>

          <div className="pedidos-itens-detalhes">
            {(pedido.itens || []).map(
              (
                item: ItemPedidoResposta,
                indice: number
              ) => {
                const quantidade =
                  Number(item.quantidade) || 0;

                const preco =
                  Number(item.precoUnitario) || 0;

                const subtotal =
                  Number(item.subtotal) ||
                  preco * quantidade;

                const nome =
                  item.produto?.nome ||
                  item.nomeProduto ||
                  `Produto ${String(
                    item.produtoId
                  ).slice(0, 8)}`;

                return (
                  <article
                    key={`${item.produtoId}-${indice}`}
                    className="pedidos-item-detalhe"
                  >
                    <div>
                      <strong>{nome}</strong>

                      <span>
                        {quantidade} ×{" "}
                        {formatarMoeda(preco)}
                      </span>
                    </div>

                    <strong>
                      {formatarMoeda(subtotal)}
                    </strong>
                  </article>
                );
              }
            )}

            {(!pedido.itens ||
              pedido.itens.length === 0) && (
              <div className="pedidos-sem-detalhes">
                A API não retornou os itens deste
                pedido na listagem.
              </div>
            )}
          </div>
        </div>

        <footer className="pedidos-modal-footer pedidos-footer-detalhes">
          <button
            type="button"
            className="pedidos-btn-finalizar"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}