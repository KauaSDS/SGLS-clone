import { useEffect, useState } from "react";
import type {
  ProdutoEstoque,
  TipoMovimentacao
} from "../../types/estoque";

interface ProdutoEstoqueRowProps {
  produto: ProdutoEstoque;
  categoriaNome: string;
  baseUrl: string;
  onMovimentacao: (
    produto: ProdutoEstoque,
    tipo: TipoMovimentacao
  ) => void;
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

function classificarEstoque(estoque: number) {
  if (estoque <= 0) {
    return {
      classe: "sem-estoque",
      texto: "Sem estoque"
    };
  }

  if (estoque <= 5) {
    return {
      classe: "critico",
      texto: "Estoque crítico"
    };
  }

  if (estoque <= 10) {
    return {
      classe: "baixo",
      texto: "Estoque baixo"
    };
  }

  return {
    classe: "normal",
    texto: "Disponível"
  };
}

export default function ProdutoEstoqueRow({
  produto,
  categoriaNome,
  baseUrl,
  onMovimentacao
}: ProdutoEstoqueRowProps) {
  const [erroImagem, setErroImagem] = useState(false);

  const estoque = Number(produto.estoque) || 0;
  const ativo = produtoAtivo(produto.ativa);
  const classificacao = classificarEstoque(estoque);

  const precoFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(produto.preco) || 0);

  useEffect(() => {
    setErroImagem(false);
  }, [produto.imagemId]);

  return (
    <tr>
      <td>
        <div className="estoque-produto">
          <div className="estoque-imagem-wrapper">
            {produto.imagemId && !erroImagem ? (
              <img
                className="estoque-produto-imagem"
                src={`${baseUrl}/api/images/${produto.imagemId}/download`}
                alt={`Imagem de ${produto.nome}`}
                onError={() => setErroImagem(true)}
              />
            ) : (
              <div className="estoque-imagem-placeholder">
                <span className="estoque-placeholder-icone">
                  ▧
                </span>

                <span>Sem imagem</span>
              </div>
            )}
          </div>

          <div>
            <p className="estoque-produto-nome">
              {produto.nome}
            </p>

            <span
              className="estoque-produto-id"
              title={produto.id}
            >
              ID: {produto.id}
            </span>
          </div>
        </div>
      </td>

      <td>
        <span className="estoque-categoria">
          {categoriaNome}
        </span>
      </td>

      <td>
        <span className="estoque-preco">
          {precoFormatado}
        </span>
      </td>

      <td>
        <div className="estoque-quantidade">
          <strong>{estoque} un.</strong>

          <span
            className={`estoque-badge ${classificacao.classe}`}
          >
            {classificacao.texto}
          </span>
        </div>
      </td>

      <td>
        <span
          className={`estoque-status ${
            ativo ? "ativo" : "inativo"
          }`}
        >
          {ativo ? "Ativo" : "Inativo"}
        </span>
      </td>

      <td>
        <div className="estoque-acoes">
          <button
            type="button"
            className="estoque-btn-acao estoque-btn-entrada"
            title="Registrar entrada"
            disabled={!ativo}
            onClick={() =>
              onMovimentacao(produto, "entrada")
            }
          >
            +
          </button>

          <button
            type="button"
            className="estoque-btn-acao estoque-btn-saida"
            title="Registrar saída"
            disabled={!ativo || estoque <= 0}
            onClick={() =>
              onMovimentacao(produto, "saida")
            }
          >
            −
          </button>
        </div>
      </td>
    </tr>
  );
}