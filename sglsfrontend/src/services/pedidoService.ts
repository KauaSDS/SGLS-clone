import { api } from "./api";
import type {
  CriarPedidoPayload,
  Pedido
} from "../types/pedido";

function extrairLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const resposta = data as {
      data?: unknown;
      items?: unknown;
      value?: unknown;
    };

    if (Array.isArray(resposta.data)) return resposta.data as T[];
    if (Array.isArray(resposta.items)) return resposta.items as T[];
    if (Array.isArray(resposta.value)) return resposta.value as T[];
  }

  return [];
}

function extrairPedidoId(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const resposta = data as {
    id?: unknown;
    pedidoId?: unknown;
    data?: {
      id?: unknown;
      pedidoId?: unknown;
    };
  };

  const valor =
    resposta.id ??
    resposta.pedidoId ??
    resposta.data?.id ??
    resposta.data?.pedidoId;

  return typeof valor === "string" && valor.trim()
    ? valor
    : null;
}

function guidValido(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      valor
    )
  );
}

function lerObjetoLocalStorage(
  chave: string
): Record<string, unknown> | null {
  const valor = localStorage.getItem(chave);
  if (!valor) return null;

  try {
    const objeto = JSON.parse(valor);

    return objeto && typeof objeto === "object"
      ? (objeto as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function obterToken(): string | null {
  const chavesDiretas = [
    "token",
    "authToken",
    "accessToken",
    "jwt"
  ];

  for (const chave of chavesDiretas) {
    const valor = localStorage.getItem(chave);

    if (valor) {
      return valor.replace(/^Bearer\s+/i, "");
    }
  }

  for (const chave of ["auth", "usuario", "user"]) {
    const objeto = lerObjetoLocalStorage(chave);

    const token =
      objeto?.token ||
      objeto?.accessToken ||
      objeto?.authToken;

    if (typeof token === "string") {
      return token.replace(/^Bearer\s+/i, "");
    }
  }

  return null;
}

function decodificarPayloadJwt(
  token: string
): Record<string, unknown> | null {
  try {
    const parte = token.split(".")[1];
    if (!parte) return null;

    const base64 = parte
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parte.length / 4) * 4, "=");

    const json = decodeURIComponent(
      atob(base64)
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

    const payload = JSON.parse(json);

    return payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function buscarGuidNoObjeto(
  objeto: Record<string, unknown> | null
): string | null {
  if (!objeto) return null;

  const chaves = [
    "usuarioId",
    "userId",
    "id",
    "nameid",
    "sub",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
  ];

  for (const chave of chaves) {
    const valor = objeto[chave];
    if (guidValido(valor)) return valor;
  }

  return null;
}

export const pedidoService = {
  async listar(): Promise<Pedido[]> {
    const response = await api.get("/pedidos");

    return extrairLista<Pedido>(response.data).map(
      (pedido) => ({
        ...pedido,
        id: String(pedido.id)
      })
    );
  },

  async criar(
    payload: CriarPedidoPayload
  ): Promise<string> {
    const response = await api.post("/pedidos", payload);
    const pedidoId = extrairPedidoId(response.data);

    if (!pedidoId) {
      throw new Error(
        "O pedido foi criado, mas a API não retornou o ID necessário para finalizá-lo."
      );
    }

    return pedidoId;
  },

  async finalizar(id: string): Promise<void> {
    await api.post(`/pedidos/${id}/finalizar`);
  },

  async cancelar(id: string): Promise<Pedido | null> {
    const response = await api.post(
      `/pedidos/${id}/cancelar`
    );

    const data = response.data;

    if (data === undefined || data === null || data === "") {
      return null;
    }

    if (
      typeof data === "string" ||
      typeof data === "number"
    ) {
      return {
        id,
        status: data
      };
    }

    if (typeof data === "object") {
      const resposta = data as {
        id?: unknown;
        status?: unknown;
        data?: unknown;
      };

      const objeto =
        resposta.data &&
        typeof resposta.data === "object"
          ? (resposta.data as Record<string, unknown>)
          : (resposta as Record<string, unknown>);

      return {
        ...(objeto as unknown as Pedido),
        id: String(objeto.id ?? id),
        status:
          (objeto.status as number | string | undefined) ??
          "Cancelado"
      };
    }

    return null;
  },

  obterUsuarioIdLogado(): string | null {
    if (typeof window === "undefined") return null;

    for (const chave of ["usuarioId", "userId"]) {
      const valor = localStorage.getItem(chave);
      if (guidValido(valor)) return valor;
    }

    for (const chave of [
      "usuario",
      "user",
      "auth",
      "usuarioLogado"
    ]) {
      const id = buscarGuidNoObjeto(
        lerObjetoLocalStorage(chave)
      );

      if (id) return id;
    }

    const token = obterToken();

    return token
      ? buscarGuidNoObjeto(decodificarPayloadJwt(token))
      : null;
  }
};