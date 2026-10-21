# [QA Manual] Executar testes manuais do fluxo completo do back-end (SGLS)

## Contexto
Precisamos validar manualmente os principais fluxos da API/back-end do SGLS antes de avançar com ajustes finais.

## Objetivo
Executar testes manuais end-to-end dos endpoints principais, registrar evidências e abrir bugs encontrados.

## Pré-requisitos
- Ambiente local com API rodando.
- Ferramenta para requisições (Postman/Insomnia/curl).
- Usuários de teste com perfis:
  - `Admin`
  - `Vendedor`
- Token JWT válido para cada perfil.

## Checklist de execução

### 1) Autenticação
- [ ] Login com credenciais válidas retorna `200` e token JWT.
- [ ] Login com senha inválida retorna erro apropriado (`401`/`400`).
- [ ] Acesso sem token em endpoint protegido retorna `401`.
- [ ] Acesso com token inválido/expirado retorna `401`.

### 2) Produtos
- [ ] Listar produtos autenticado retorna `200` e lista.
- [ ] Criar produto com payload válido retorna sucesso.
- [ ] Editar produto existente com payload válido retorna sucesso.
- [ ] Excluir produto como `Admin` retorna sucesso.
- [ ] Confirmar que `Vendedor` não consegue excluir (esperado: `403`).

### 3) Categorias
- [ ] Listar categorias autenticado retorna `200`.
- [ ] Criar categoria como `Admin` retorna sucesso.
- [ ] Editar categoria como `Admin` retorna sucesso.
- [ ] Excluir/desativar categoria como `Admin` retorna sucesso.
- [ ] Confirmar que `Vendedor` não cria/edita/remove categoria (esperado: `403`).

### 4) Pedidos
- [ ] Criar pedido com itens válidos retorna sucesso e ID.
- [ ] Consultar pedido por ID retorna dados corretos.
- [ ] Finalizar pedido retorna sucesso e status atualizado.
- [ ] Cancelar pedido como `Admin` retorna sucesso.
- [ ] Confirmar que `Vendedor` não cancela pedido (esperado: `403`).

### 5) Estoque
- [ ] Entrada de estoque com payload válido retorna sucesso.
- [ ] Saída de estoque com payload válido retorna sucesso.
- [ ] Validar bloqueio para saída maior que estoque disponível.

### 6) Validações e cenários negativos
- [ ] Payloads com campos obrigatórios ausentes retornam erro de validação.
- [ ] IDs inexistentes retornam `404` (quando aplicável).
- [ ] Tipos inválidos (ex.: string em campo numérico) retornam erro.

## Registro de evidências
Para **cada** cenário marcado, anexar:
- Evidência (print da requisição/resposta ou log).
- Endpoint + método HTTP.
- Payload enviado (quando houver).
- Status code retornado.
- Observação breve.

## Abertura de bugs
Se houver falha, abrir issue separada com:
1. Título objetivo (`[BUG][Módulo] descrição curta`).
2. Passos para reproduzir.
3. Resultado esperado.
4. Resultado obtido.
5. Evidência (prints/logs).
6. Severidade (`Baixa`, `Média`, `Alta`).

## Entregáveis
- [ ] Checklist completo preenchido (`✅`/`❌`).
- [ ] Evidências anexadas por cenário.
- [ ] Bugs abertos e linkados nesta issue.
- [ ] Resumo final com riscos bloqueantes (se houver).

## Critérios de aceite
- Todos os cenários do checklist executados.
- Evidências mínimas anexadas.
- Não há bug crítico sem issue aberta e linkada.
- Resumo final publicado com recomendação de go/no-go.

## Prioridade
Média

## Responsável sugerido
Estagiário(a) de QA / Desenvolvimento
