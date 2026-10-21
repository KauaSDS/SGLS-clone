import React, { useEffect, useState } from "react";
import { api } from "../services/api";

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfil?: number | string;
  ativa?: boolean | string | number;
  ativo?: boolean | string | number;
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alterandoStatusId, setAlterandoStatusId] =
    useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentFuncionario, setCurrentFuncionario] =
    useState<Partial<Funcionario>>({});

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const response = await api.get("/usuarios");

      const listaUsuarios = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      const apenasVendedores = listaUsuarios.filter(
        (usuario: Funcionario) =>
          String(usuario.perfil) !== "1" &&
          String(usuario.perfil).toLowerCase() !== "admin"
      );

      setFuncionarios(
        apenasVendedores.map((usuario: Funcionario) => ({
          ...usuario,
          id: String(usuario.id)
        }))
      );
    } catch (error) {
      console.error(
        "Erro ao carregar funcionários:",
        error
      );

      alert(
        "Erro ao carregar os dados. Verifique a conexão com o servidor."
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

  function obterStatusAtual(
    funcionario: Funcionario
  ): boolean {
    return checkIsAtiva(
      funcionario.ativo ?? funcionario.ativa
    );
  }

  function obterMensagemErro(
    error: any,
    mensagemPadrao: string
  ): string {
    const data = error?.response?.data;

    if (
      data?.errors &&
      typeof data.errors === "object"
    ) {
      const mensagens = Object.entries(data.errors)
        .flatMap(([campo, erros]) =>
          Array.isArray(erros)
            ? erros.map(
                (mensagem) =>
                  `${campo}: ${String(mensagem)}`
              )
            : [`${campo}: ${String(erros)}`]
        );

      if (mensagens.length > 0) {
        return mensagens.join("\n");
      }
    }

    const mensagem =
      data?.detail ||
      data?.message ||
      data?.title ||
      error?.message;

    return typeof mensagem === "string"
      ? mensagem
      : mensagemPadrao;
  }

  function handleCreate() {
    setCurrentFuncionario({
      nome: "",
      email: "",
      senha: "",
      perfil: 2,
      ativa: true
    });

    setModalOpen(true);
  }

  async function handleToggleStatus(
    funcionario: Funcionario
  ) {
    if (!funcionario.id) {
      alert("O funcionário não possui um ID válido.");
      return;
    }

    const isAtivoAtual =
      obterStatusAtual(funcionario);

    const novoStatus = !isAtivoAtual;

    const acao = isAtivoAtual
      ? "desativar"
      : "reativar";

    const funcionariosAnteriores =
      funcionarios.map((item) => ({ ...item }));

    setFuncionarios((listaAtual) =>
      listaAtual.map((item) =>
        item.id === funcionario.id
          ? {
              ...item,
              ativo: novoStatus,
              ativa: novoStatus
            }
          : item
      )
    );

    try {
      setAlterandoStatusId(funcionario.id);

      await api.patch(
        `/usuarios/${funcionario.id}/status`,
        {
          ativo: novoStatus
        }
      );
    } catch (error: any) {
      console.error(
        `Erro ao ${acao} funcionário:`,
        error?.response?.data || error
      );

      setFuncionarios(funcionariosAnteriores);

      alert(
        obterMensagemErro(
          error,
          `Ocorreu um erro ao ${acao} o funcionário.`
        )
      );
    } finally {
      setAlterandoStatusId(null);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      const payload = {
        nome: currentFuncionario.nome || "",
        email: currentFuncionario.email || "",
        senha: currentFuncionario.senha || "",
        perfil: 2
      };

      await api.post("/usuarios", payload);

      setModalOpen(false);
      setCurrentFuncionario({});

      await loadData();
    } catch (error: any) {
      console.error(
        "Erro ao cadastrar funcionário:",
        error?.response?.data || error
      );

      alert(
        obterMensagemErro(
          error,
          "Erro ao cadastrar funcionário."
        )
      );
    }
  }

  const funcionariosFiltrados =
    funcionarios.filter((funcionario) => {
      const termo = searchTerm
        .trim()
        .toLowerCase();

      const nome = funcionario.nome || "";
      const email = funcionario.email || "";

      return (
        nome.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo)
      );
    });

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          color: "#64748b"
        }}
      >
        Carregando dados dos funcionários...
      </div>
    );
  }

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
            Funcionários
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: 0,
              fontSize: "15px"
            }}
          >
            Gerencie os acessos de vendedores.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
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
            boxShadow:
              "0 2px 4px rgba(37, 99, 235, 0.2)"
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

          Novo Funcionário
        </button>
      </div>

      <div
        style={{
          display: "flex",
          marginBottom: "20px"
        }}
      >
        <div
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
              pointerEvents: "none"
            }}
          >
            ⌕
          </div>

          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
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
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}
      >
        <div className="responsive-table-container" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              whiteSpace: "nowrap"
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc"
                }}
              >
                {[
                  "Nome",
                  "E-mail",
                  "Perfil",
                  "Status"
                ].map((titulo) => (
                  <th
                    key={titulo}
                    style={{
                      padding: "16px 24px",
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase"
                    }}
                  >
                    {titulo}
                  </th>
                ))}

                <th
                  style={{
                    padding: "16px 24px",
                    color: "#64748b",
                    fontWeight: "600",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    textAlign: "right"
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {funcionariosFiltrados.map(
                (funcionario) => {
                  const isAtivo =
                    obterStatusAtual(funcionario);

                  const alterando =
                    alterandoStatusId ===
                    funcionario.id;

                  return (
                    <tr
                      key={funcionario.id}
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9"
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "#f8fafc";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "16px 24px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#e2e8f0",
                              color: "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "14px"
                            }}
                          >
                            {funcionario.nome
                              ? funcionario.nome
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <span
                            style={{
                              fontWeight: "600",
                              color: "#0f172a",
                              fontSize: "14px"
                            }}
                          >
                            {funcionario.nome}
                          </span>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "16px 24px",
                          color: "#475569",
                          fontSize: "14px"
                        }}
                      >
                        {funcionario.email}
                      </td>

                      <td
                        style={{
                          padding: "16px 24px"
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#f3e8ff",
                            color: "#7e22ce"
                          }}
                        >
                          Vendedor
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px 24px"
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: isAtivo
                              ? "#dcfce7"
                              : "#f1f5f9",
                            color: isAtivo
                              ? "#16a34a"
                              : "#64748b"
                          }}
                        >
                          {isAtivo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px 24px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleStatus(
                                funcionario
                              )
                            }
                            disabled={alterando}
                            title={
                              isAtivo
                                ? "Desativar vendedor"
                                : "Reativar vendedor"
                            }
                            style={{
                              minWidth: "92px",
                              padding: "7px 12px",
                              borderRadius: "8px",
                              border: isAtivo
                                ? "1px solid #fecaca"
                                : "1px solid #bbf7d0",
                              backgroundColor: isAtivo
                                ? "#fef2f2"
                                : "#f0fdf4",
                              color: isAtivo
                                ? "#dc2626"
                                : "#16a34a",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: alterando
                                ? "wait"
                                : "pointer",
                              opacity: alterando ? 0.7 : 1
                            }}
                          >
                            {alterando
                              ? "Salvando..."
                              : isAtivo
                                ? "Desativar"
                                : "Reativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}

              {funcionariosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "14px"
                    }}
                  >
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="responsive-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor:
              "rgba(15,23,42,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            className="responsive-modal-content"
            style={{
              backgroundColor: "#ffffff",
              padding: "30px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "450px",
              color: "#1e293b",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}
          >
            <h3
              style={{
                margin: "0 0 24px 0",
                fontSize: "20px",
                fontWeight: "600"
              }}
            >
              Novo Funcionário
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
                  NOME COMPLETO *
                </label>

                <input
                  type="text"
                  value={currentFuncionario.nome || ""}
                  onChange={(event) =>
                    setCurrentFuncionario({
                      ...currentFuncionario,
                      nome: event.target.value
                    })
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
                  E-MAIL DE ACESSO *
                </label>

                <input
                  type="email"
                  value={currentFuncionario.email || ""}
                  onChange={(event) =>
                    setCurrentFuncionario({
                      ...currentFuncionario,
                      email: event.target.value
                    })
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

              <div style={{ marginBottom: "30px" }}>
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b"
                    }}
                  >
                    SENHA *
                  </span>

                </label>

                <input
                  type="password"
                  value={currentFuncionario.senha || ""}
                  onChange={(event) =>
                    setCurrentFuncionario({
                      ...currentFuncionario,
                      senha: event.target.value
                    })
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
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "20px"
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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