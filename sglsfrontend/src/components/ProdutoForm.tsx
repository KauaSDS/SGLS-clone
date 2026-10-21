import React, { useState, useEffect } from "react";
import { produtoService, type Produto } from "../services/produtoService";
import { categoriaService, type Categoria } from "../services/categoriaService";

interface ProdutoFormProps {
  initialData?: Partial<Produto>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProdutoForm({ initialData, onSuccess, onCancel }: ProdutoFormProps) {
  const [formData, setFormData] = useState<Partial<Produto>>({
    nome: "",
    descricao: "",
    preco: 0,
    estoque: 0,
    categoriaId: 0,
    ativo: true,
    ...initialData,
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null); 

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const data = await categoriaService.listar();
        setCategorias(data);
      } catch (error) {
        console.error("Erro ao carregar categorias", error);
      }
    }
    fetchCategorias();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let produtoId = formData.id;

      if (produtoId) {
       
        await produtoService.atualizar(produtoId, formData);
      } else {
        
        const produtoCriado = await produtoService.criar(formData);
        produtoId = produtoCriado.id;
      }

      if (imageFile && produtoId) {
        await produtoService.uploadImagem(produtoId, imageFile);
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao guardar o produto:", error);
      alert("Erro ao guardar o produto ou fazer o upload da imagem.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    
    let parsedValue: string | number | boolean = value;

    if (type === "number") {
      parsedValue = parseFloat(value);
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  }

  const isEditing = !!formData.id;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#242424", padding: "20px", borderRadius: "8px", minWidth: "400px", color: "white" }}>
        <h3>{isEditing ? "Editar Produto" : "Criar Novo Produto"}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Nome:</label>
            <input
              type="text"
              name="nome"
              value={formData.nome || ""}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Descrição:</label>
            <textarea
              name="descricao"
              value={formData.descricao || ""}
              onChange={handleChange}
              rows={3}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Categoria:</label>
            <select
              name="categoriaId"
              value={formData.categoriaId || ""}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Preço:</label>
              <input
                type="number"
                name="preco"
                step="0.01"
                min="0"
                value={formData.preco || ""}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Estoque:</label>
              <input
                type="number"
                name="estoque"
                min="0"
                value={formData.estoque || ""}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Imagem do Produto:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box", backgroundColor: "#333", color: "white", border: "1px solid #555" }}
            />
          </div>

          <div style={{ marginBottom: "15px", marginTop: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo !== false}
                onChange={handleChange}
              />
              Produto Ativo
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
            <button type="button" onClick={onCancel} disabled={loading} style={{ padding: "8px 16px" }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
              {loading ? "A Guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}