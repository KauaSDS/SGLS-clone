import React, { useEffect, useState } from "react";
import { api } from "../services/api"; 
import { type Categoria as CategoriaBase } from "../services/categoriaService";

type Categoria = Omit<CategoriaBase, "id"> & {
  id: string;
  ativa?: any; 
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [filtroStatus, setFiltroStatus] = useState<"ativas" | "inativas">("ativas");

  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<Partial<Categoria>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    try {
      setLoading(true);
      const response = await api.get('/categorias');
      setCategorias(response.data as unknown as Categoria[]);
    } catch (error) {
      console.error("Erro ao carregar categorias", error);
      alert("Erro ao carregar categorias. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  }

  const checkIsAtiva = (valor: any) => {
    if (valor === false || valor === 0 || valor === "0" || valor === "false") return false;
    return true; 
  };

  function handleCreate() {
    setIsEditing(false);
    setCurrentCategoria({ nome: "", ativa: true }); 
    setModalOpen(true);
  }

  function handleEdit(categoria: Categoria) {
    setIsEditing(true);
    setCurrentCategoria(categoria);
    setModalOpen(true);
  }

  async function handleToggleStatus(categoria: Categoria) {
    const isAtivaAtual = checkIsAtiva(categoria.ativa);
    const novoStatusBooleano = !isAtivaAtual; 
    
    const categoriasAnteriores = [...categorias];
    setCategorias(categorias.map(cat => 
      cat.id === categoria.id ? { ...cat, ativa: novoStatusBooleano } : cat
    ));

    try {
      await api.put('/categorias', {
        ...categoria,
        ativa: novoStatusBooleano 
      });
    } catch (error: any) {
      console.error("ERRO ao alterar status:", error);
      setCategorias(categoriasAnteriores); 
      
      const mensagemErro = error.response?.data?.detail || error.response?.data?.message || "Ocorreu um erro ao alterar o status.";
      alert(typeof mensagemErro === 'string' ? mensagemErro : "Ocorreu um erro na requisição.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...currentCategoria,
        ativa: currentCategoria.ativa !== undefined ? checkIsAtiva(currentCategoria.ativa) : true
      };

      if (isEditing && currentCategoria.id) {
        await api.put('/categorias', payload);
      } else {
        await api.post('/categorias', payload);
      }
      
      setModalOpen(false);
      setIsEditing(false);
      setCurrentCategoria({});
      
      await loadCategorias();
    } catch (error: any) {
      console.error("Erro ao salvar categoria", error);
      const mensagemErro = error.response?.data?.detail || error.response?.data?.message || "Erro ao salvar categoria.";
      alert(typeof mensagemErro === 'string' ? mensagemErro : "Erro ao salvar categoria.");
    }
  }

  const categoriasFiltradas = categorias.filter(cat => {
    const nomeSeguro = cat.nome || "";
    const matchBusca = nomeSeguro.toLowerCase().includes(searchTerm.toLowerCase());
    const isAtiva = checkIsAtiva(cat.ativa); 
    const matchStatus = filtroStatus === "ativas" ? isAtiva : !isAtiva;
    return matchBusca && matchStatus;
  });

  if (loading) {
    return <div style={{ padding: "40px", color: "#64748b" }}>Carregando dados...</div>;
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", color: "#0f172a", paddingBottom: "40px" }}>
    
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>Categorias</h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Gerencie todas as categorias de produtos da loja</p>
        </div>
        <button 
          type="button"
          onClick={handleCreate} 
          style={{ 
            display: "flex", alignItems: "center", gap: "8px", 
            backgroundColor: "#2563eb", color: "#ffffff", 
            border: "none", borderRadius: "8px", 
            padding: "10px 16px", fontSize: "14px", fontWeight: "600", 
            cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Categoria
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "12px 12px 12px 40px",
              borderRadius: "8px", border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff", fontSize: "14px",
              color: "#1e293b", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          <button 
            type="button"
            onClick={() => setFiltroStatus("ativas")}
            style={{ 
              padding: "8px 16px", fontSize: "14px", fontWeight: "500", border: "none", borderRadius: "6px", cursor: "pointer",
              backgroundColor: filtroStatus === "ativas" ? "#ffffff" : "transparent",
              color: filtroStatus === "ativas" ? "#1e293b" : "#64748b",
              boxShadow: filtroStatus === "ativas" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "0.2s"
            }}
          >
            Ativas
          </button>
          <button 
            type="button"
            onClick={() => setFiltroStatus("inativas")}
            style={{ 
              padding: "8px 16px", fontSize: "14px", fontWeight: "500", border: "none", borderRadius: "6px", cursor: "pointer",
              backgroundColor: filtroStatus === "inativas" ? "#ffffff" : "transparent",
              color: filtroStatus === "inativas" ? "#1e293b" : "#64748b",
              boxShadow: filtroStatus === "inativas" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "0.2s"
            }}
          >
            Inativas
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: "#ffffff", borderRadius: "12px", 
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", 
        border: "1px solid #e2e8f0", overflow: "hidden" 
      }}>
        <div className="responsive-table-container" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", width: "80px" }}>Posição</th>
                <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>Nome</th>
                <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", textAlign: "right", width: "120px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((cat, index) => {
                const isAtiva = checkIsAtiva(cat.ativa);
                
                return (
                  <tr key={cat.id} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: "16px 24px", color: "#475569", fontWeight: "600", fontSize: "14px" }}>
                      {index + 1}º
                    </td>
                    <td style={{ padding: "16px 24px", color: "#1e293b", fontWeight: "600", fontSize: "14px" }}>
                      {cat.nome}
                    </td>
 
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                        backgroundColor: isAtiva ? "#dcfce7" : "#f1f5f9",
                        color: isAtiva ? "#16a34a" : "#64748b"
                      }}>
                        {isAtiva ? "Ativa" : "Inativa"}
                      </span>
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
      
                        {isAtiva && (
                          <button 
                            type="button"
                            onClick={() => handleEdit(cat)} 
                            title="Editar Categoria"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#3b82f6", padding: "6px" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(cat)} 
                          title={isAtiva ? "Inativar" : "Reativar"}
                          style={{ 
                            display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: "6px",
                            color: isAtiva ? "#f59e0b" : "#10b981" 
                          }}
                        >
                          {isAtiva ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
              {categoriasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                    Nenhuma categoria {filtroStatus} encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="responsive-modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div className="responsive-modal-content" style={{ 
            backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", 
            width: "100%", maxWidth: "450px", color: "#1e293b", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            boxSizing: "border-box" 
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600" }}>
              {isEditing ? "Editar Categoria" : "Nova Categoria"}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
                  NOME DA CATEGORIA
                </label>
                <input
                  type="text"
                  placeholder="Ex: Camisetas"
                  value={currentCategoria.nome || ""}
                  onChange={(e) => setCurrentCategoria({ ...currentCategoria, nome: e.target.value })}
                  required
                  style={{ 
                    width: "100%", padding: "12px", borderRadius: "8px", 
                    border: "1px solid #cbd5e1", fontSize: "15px", 
                    color: "#000000", backgroundColor: "#f8fafc",
                    outline: "none", boxSizing: "border-box" 
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  style={{ 
                    padding: "10px 16px", backgroundColor: "#ffffff", color: "#475569", 
                    border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "500", cursor: "pointer" 
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: "10px 20px", backgroundColor: "#2563eb", color: "#ffffff", 
                    border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" 
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