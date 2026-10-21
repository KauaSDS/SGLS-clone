import type {
  ProdutoEstoque,
  TipoMovimentacao
} from "../../types/estoque";

interface MovimentacaoModalProps {
  produtos: ProdutoEstoque[];
  produtoSelecionado?: ProdutoEstoque;
  produtoId: string;
  tipo: TipoMovimentacao;
  quantidade: number | "";
  saldoPrevisto: number | null;
  salvando: boolean;
  onProdutoChange: (id: string) => void;
  onTipoChange: (tipo: TipoMovimentacao) => void;
  onQuantidadeChange: (quantidade: number | "") => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function MovimentacaoModal({
  produtos,
  produtoSelecionado,
  produtoId,
  tipo,
  quantidade,
  saldoPrevisto,
  salvando,
  onProdutoChange,
  onTipoChange,
  onQuantidadeChange,
  onClose,
  onSubmit
}: MovimentacaoModalProps) {
  return (
    <div
      className="estoque-modal-overlay responsive-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="estoque-modal responsive-modal-content">
        <div className="estoque-modal-header">
          <div>
            <h3>Nova movimentação</h3>

            <p>
              Registre uma entrada ou saída no estoque
            </p>
          </div>

          <button
            type="button"
            className="estoque-btn-fechar"
            onClick={onClose}
            disabled={salvando}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="estoque-form-grupo">
            <label className="estoque-label">
              Produto *
            </label>

            <select
              className="estoque-select"
              value={produtoId}
              required
              onChange={(event) =>
                onProdutoChange(event.target.value)
              }
            >
              <option value="" disabled>
                Selecione o produto...
              </option>

              {produtos.map((produto) => (
                <option
                  key={produto.id}
                  value={produto.id}
                >
                  {produto.nome} — atual:{" "}
                  {produto.estoque} un.
                </option>
              ))}
            </select>
          </div>

          <div className="estoque-form-grupo">
            <label className="estoque-label">
              Tipo da movimentação *
            </label>

            <div className="estoque-tipos">
              <button
                type="button"
                className={`estoque-tipo-btn entrada ${
                  tipo === "entrada" ? "selecionado" : ""
                }`}
                onClick={() => onTipoChange("entrada")}
              >
                + Entrada
              </button>

              <button
                type="button"
                className={`estoque-tipo-btn saida ${
                  tipo === "saida" ? "selecionado" : ""
                }`}
                onClick={() => onTipoChange("saida")}
              >
                − Saída
              </button>
            </div>
          </div>

          <div className="estoque-form-grupo">
            <label className="estoque-label">
              Quantidade *
            </label>

            <input
              className="estoque-input"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              required
              placeholder="Informe a quantidade"
              onChange={(event) =>
                onQuantidadeChange(
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                )
              }
            />
          </div>

          {produtoSelecionado && (
            <div className="estoque-resumo-movimentacao">
              <div className="estoque-resumo-linha">
                <span>Produto</span>
                <strong>{produtoSelecionado.nome}</strong>
              </div>

              <div className="estoque-resumo-linha">
                <span>Saldo atual</span>

                <strong>
                  {produtoSelecionado.estoque} un.
                </strong>
              </div>

              {saldoPrevisto !== null && (
                <div
                  className={`estoque-resumo-linha ${
                    saldoPrevisto < 0 ? "erro" : ""
                  }`}
                >
                  <span>Saldo previsto</span>
                  <strong>{saldoPrevisto} un.</strong>
                </div>
              )}
            </div>
          )}

          <div className="estoque-modal-acoes">
            <button
              type="button"
              className="estoque-btn-cancelar"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="estoque-btn-confirmar"
              disabled={
                salvando ||
                saldoPrevisto === null ||
                saldoPrevisto < 0
              }
            >
              {salvando
                ? "Salvando..."
                : "Confirmar movimentação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}