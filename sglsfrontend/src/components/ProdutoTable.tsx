import type { Produto } from "../services/produtoService";
import type { Categoria } from "../services/categoriaService";
import { api } from "../services/api";

interface ProdutoTableProps {
  produtos: Produto[];
  categorias: Categoria[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
}

export default function ProdutoTable({
  produtos,
  categorias,
  onEdit,
  onDelete
}: ProdutoTableProps) {
  if (produtos.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          padding: "20px"
        }}
      >
        Nenhum produto encontrado.
      </p>
    );
  }

  const baseUrl = String(api.defaults.baseURL || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

  return (
    <div className="responsive-table-container">
      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left"
        }}
      >
      <thead>
        <tr
          style={{
            backgroundColor: "#333",
            color: "#fff"
          }}
        >
          <th>ID</th>
          <th>Imagem</th>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Preço</th>
          <th>Estoque</th>
          <th>Ativo</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>
        {produtos.map((produto) => {
          const categoriaNome =
            produto.categoria?.nome ||
            categorias.find(
              (categoria) =>
                String(categoria.id) ===
                String(produto.categoriaId)
            )?.nome ||
            "-";

          return (
            <tr
              key={String(produto.id)}
              style={{
                borderBottom: "1px solid #444"
              }}
            >
              <td>{produto.id}</td>

              <td style={{ textAlign: "center" }}>
                {produto.imagemId ? (
                  <img
                    src={`${baseUrl}/api/images/${produto.imagemId}/download`}
                    alt={produto.nome}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: "#ccc",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      color: "#666"
                    }}
                  >
                    Sem Img
                  </div>
                )}
              </td>

              <td>{produto.nome}</td>

              <td>
                {produto.descricao || "-"}
              </td>

              <td>{categoriaNome}</td>

              <td>
                R${" "}
                {Number(produto.preco || 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </td>

              <td>{produto.estoque}</td>

              <td>
                {produto.ativo ? "Sim" : "Não"}
              </td>

              <td>
                <button
                  type="button"
                  onClick={() => onEdit(produto)}
                  style={{
                    marginRight: "10px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor: "#0288d1",
                    color: "white",
                    border: "none"
                  }}
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(String(produto.id))
                  }
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor: "#d32f2f",
                    color: "white",
                    border: "none"
                  }}
                >
                  Excluir
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  );
}