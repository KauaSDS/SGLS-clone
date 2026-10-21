import { api } from "./api";

export interface UsuarioResumo {
  id: string;
  nome: string;
  email?: string;
  perfil?: string;
}

const cacheUsuarios = new Map<string, UsuarioResumo>();

function obterObjetoResposta(
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
    return resposta.data as Record<string, unknown>;
  }

  if (
    resposta.value &&
    typeof resposta.value === "object"
  ) {
    return resposta.value as Record<string, unknown>;
  }

  return data as Record<string, unknown>;
}

function normalizarUsuario(
  data: unknown,
  usuarioId: string
): UsuarioResumo {
  const usuario = obterObjetoResposta(data);

  if (!usuario) {
    throw new Error(
      "A API não retornou os dados do vendedor."
    );
  }

  const nome =
    usuario.nome ??
    usuario.name ??
    usuario.Nome ??
    usuario.Name;

  const email =
    usuario.email ??
    usuario.Email;

  const perfil =
    usuario.perfil ??
    usuario.Perfil;

  return {
    id: String(
      usuario.id ??
      usuario.Id ??
      usuarioId
    ),
    nome:
      typeof nome === "string" && nome.trim()
        ? nome
        : typeof email === "string" && email.trim()
          ? email
          : "Vendedor não identificado",
    email:
      typeof email === "string"
        ? email
        : undefined,
    perfil:
      typeof perfil === "string"
        ? perfil
        : undefined
  };
}

async function buscarUsuario(
  rota: string,
  usuarioId: string
): Promise<UsuarioResumo> {
  const response = await api.get(
    `${rota}/${usuarioId}`
  );

  return normalizarUsuario(
    response.data,
    usuarioId
  );
}

export const usuarioService = {
  async obterPorId(
    usuarioId: string
  ): Promise<UsuarioResumo> {
    const usuarioEmCache =
      cacheUsuarios.get(usuarioId);

    if (usuarioEmCache) {
      return usuarioEmCache;
    }

    let usuario: UsuarioResumo;

    try {
      usuario = await buscarUsuario(
        "/usuarios",
        usuarioId
      );
    } catch (error: any) {
      
      if (error?.response?.status !== 404) {
        throw error;
      }

      usuario = await buscarUsuario(
        "/usuario",
        usuarioId
      );
    }

    cacheUsuarios.set(usuarioId, usuario);

    return usuario;
  }
};