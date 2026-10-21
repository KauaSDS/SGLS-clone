# Auditoria de segurança da API para futura integração Pix

**Data da revisão:** 26/08/2026
**Escopo:** código da API ASP.NET Core, repositórios EF Core, configurações versionadas e `docker-compose.yml`. Esta é uma revisão estática: não inclui pentest, teste de carga, configuração do provedor de nuvem, DNS, firewall ou PSP/banco.

## Resumo executivo

Antes de aceitar qualquer pagamento Pix em produção, **rate limiting, validação de entrada e proteção de segredos devem ser tratados como bloqueadores**. Também é necessário implementar o desenho de pagamentos (webhook autenticado, idempotência e trilha de auditoria) antes de habilitar a funcionalidade. O uso atual de EF Core com LINQ não revelou SQL dinâmico, portanto não há evidência de SQL injection no código auditado; a prevenção deve continuar como requisito de engenharia. Não há acesso a banco NoSQL neste repositório, logo NoSQL injection não é aplicável no estado atual.

| Controle avaliado | Decisão | Prioridade | Situação observada |
| --- | --- | --- | --- |
| Load Balancer | Recomendado para produção com alta disponibilidade | Alta antes de escalar horizontalmente | Não há configuração de balanceamento, health check ou proxy confiável versionada. |
| SQL injection | Obrigatório manter como prevenção contínua | Alta | Os repositórios usam EF Core/LINQ; não foram encontrados `FromSql`, `ExecuteSql*`, comandos Npgsql nem SQL interpolado. |
| NoSQL injection | Não pertinente agora; obrigatório se NoSQL for adotado | Condicional | Não há driver, conexão ou consulta NoSQL no escopo auditado. |
| CDN + WAF | WAF obrigatório; CDN recomendada para conteúdo público | Alta | Não há integração ou configuração correspondente; `/uploads` é publicado diretamente pela API. |
| Rate limit | Obrigatório | Bloqueador | Não há `AddRateLimiter`/`UseRateLimiter`; logins e futuros webhooks não têm limitação. |
| Validation | Obrigatório | Bloqueador | Há validação pontual para upload, mas os DTOs de entrada não possuem atributos/regras declarativas. |

## Achados que exigem ação antes do Pix

### 1. Segredos versionados e CORS permissivo — crítico

`appsettings.json` contém chave JWT e credencial PostgreSQL. Além disso, a política CORS chamada `AllowAll` aceita qualquer origem, método e cabeçalho. Isso permite que qualquer site chame a API a partir do navegador e torna inadequado expor a API de pagamentos dessa forma.

**Ações obrigatórias:**

1. Revogar/rotacionar a chave JWT e a senha PostgreSQL já presentes no histórico; não basta somente removê-las do arquivo.
2. Mover segredos para secret manager/variáveis de ambiente da plataforma e manter somente nomes/exemplos sem valores reais no repositório.
3. Trocar `AllowAnyOrigin`, `AllowAnyMethod` e `AllowAnyHeader` por uma allowlist explícita dos domínios de produção e dos métodos/cabeçalhos necessários. Não combinar credenciais com origem curinga.
4. Garantir TLS na borda, HSTS, redirecionamento HTTPS e tratamento correto de headers encaminhados quando houver proxy/load balancer.

### 2. Rate limit ausente — crítico

Os dois endpoints de login são públicos e não possuem controle de tentativas. Um futuro endpoint de criação de cobrança e o webhook do PSP também seriam alvos de abuso, brute force e custo indevido.

**Ações obrigatórias:** configurar o middleware nativo `AddRateLimiter`/`UseRateLimiter`, incluindo resposta `429` e `Retry-After`. Aplicar políticas distintas e centralizadas por rota:

| Rota/classe | Chave | Política inicial sugerida | Observação |
| --- | --- | --- | --- |
| Login interno e de cliente | IP + identificador normalizado | 5 tentativas/minuto e 20/hora | Não revelar se o e-mail existe; registrar eventos de bloqueio. |
| Criar cobrança Pix | ID do cliente autenticado | 10/minuto e limite diário de valor/quantidade | Exigir autenticação e chave de idempotência. |
| Webhook do PSP | IP allowlist do PSP **após** validar assinatura | conforme contrato do PSP, com limite alto | Nunca confiar somente no IP; a assinatura é o controle principal. |
| Consultas e catálogo público | IP | limite mais amplo | Cachear respostas públicas quando aplicável. |

Em múltiplas réplicas, o contador deve ser distribuído (por exemplo, Redis gerenciado) ou aplicado também pelo API gateway/WAF. Limites são valores iniciais e devem ser ajustados por métricas e pelo contrato do PSP.

### 3. Validação de entrada incompleta — crítico

Embora `[ApiController]` retorne 400 quando há erros de model binding, a maioria dos DTOs aceita strings nulas/vazias, preços e quantidades sem limites declarados. A validação de upload limita tamanho, extensões e `Content-Type`, o que é positivo, porém tipo MIME declarado pelo cliente não comprova o conteúdo do arquivo.

**Ações obrigatórias:**

1. Adotar validação no limite da API (DataAnnotations ou FluentValidation) para todos os requests: `Required`, comprimentos máximos, e-mail, senha, `Guid` não vazio, valores monetários positivos, quantidade mínima 1 e máximo operacional, listas não vazias e limite de itens por pedido.
2. Revalidar regras de negócio no serviço dentro de transações: preço calculado no servidor, estoque, permissões e transições de status. Nunca aceitar valor de cobrança Pix informado pelo cliente como fonte de verdade.
3. Para upload, inspecionar magic bytes/decodificar imagem, remover metadados quando aplicável e bloquear formatos que não sejam necessários; servir arquivos por domínio/bucket separado em vez de pela mesma API autenticada.
4. Impor limite global de tamanho do corpo, limite de multipart e timeouts de requisição na borda e na aplicação.

### 4. Modelo de pagamento Pix ainda inexistente — crítico

Não há entidades, endpoints ou serviço de pagamento no escopo. Logo, a integração deve nascer com controles próprios, em vez de reutilizar o fluxo de pedido como confirmação de pagamento.

**Desenho mínimo obrigatório:**

1. Criar uma entidade de cobrança com identificador interno imutável, `txid`/identificador externo único, pedido associado, valor em centavos, expiração, status, timestamps e versão/concorrência.
2. Gerar a cobrança no servidor após recalcular o pedido; persistir a intenção antes de chamar o PSP e usar transação/outbox para eventos.
3. Exigir `Idempotency-Key` no `POST` de cobrança, com índice único por cliente/operação. Repetições devem devolver o mesmo resultado e nunca gerar nova cobrança.
4. Criar endpoint de webhook separado, sem autenticação JWT de usuário, que valide assinatura/HMAC ou mTLS conforme a documentação do PSP, timestamp/nonce quando disponível e o corpo bruto. Usar segredo exclusivo, rotação e comparação em tempo constante.
5. No webhook, consultar a cobrança no PSP quando o contrato exigir, comparar `txid`, valor, moeda, recebedor e estado esperado, e só então aplicar uma transição de status idempotente em transação.
6. Nunca registrar QR code sensível, segredo, `Authorization`, corpo integral do webhook ou dados pessoais em logs. Produzir trilha de auditoria append-only com correlação, evento, resultado e ator técnico.

## Avaliação das medidas solicitadas

### Load Balancer — recomendado, não é controle isolado contra fraude

É pertinente quando a API tiver requisito de disponibilidade ou mais de uma réplica. Ele deve ficar atrás de um API gateway/WAF e executar health checks de uma rota que não exponha dados. A API deverá ser stateless: não guardar sessão, rate-limit ou idempotência apenas na memória. O load balancer não substitui WAF, validação, autenticação de webhook ou rate limiting.

**Gatilho de adoção:** obrigatório ao operar com duas ou mais instâncias ou SLA de disponibilidade; para uma única instância inicial, manter plano de backup, monitoramento e estratégia de failover antes do lançamento.

### SQL injection — pertinente e já mitigada pelo padrão atual

O acesso relacional utiliza PostgreSQL por EF Core e consultas LINQ; a análise não encontrou APIs de SQL bruto. Esse padrão parametriza valores e reduz o risco de injection. Ele não autoriza montar SQL com concatenação no futuro.

**Regra permanente:** proibir SQL interpolado/concatenado; quando SQL bruto for inevitável, usar parâmetros tipados, allowlist para identificadores não parametrizáveis, conta de banco com menor privilégio, revisão de código e testes negativos. A conta da aplicação não deve poder administrar schema, criar extensões ou acessar bancos não necessários.

### NoSQL injection — não pertinente no estado atual

Não há banco/driver NoSQL identificado. Não adicionar um banco NoSQL somente para rate limiting ou pagamentos sem justificativa; Redis pode ser usado como infraestrutura de limite/idempotência, mas não deve receber filtros de consulta criados a partir do JSON do cliente.

**Se MongoDB/NoSQL for introduzido:** validar schemas estritos, rejeitar operadores iniciados por `$` e chaves com `.`, construir filtros no servidor com APIs tipadas, desabilitar avaliação de código e aplicar RBAC/least privilege.

### CDN + WAF — WAF obrigatório; CDN conforme conteúdo público

Um WAF na borda é pertinente antes de expor criação/consulta de cobranças e webhooks: regras gerenciadas OWASP, proteção de bots, limite por IP e logs devem complementar o limite da aplicação. Regras de WAF devem ser testadas em modo de observação para não bloquear o PSP.

A CDN é recomendada para imagens e conteúdo estático público, reduzindo carga e protegendo a origem. Não cachear respostas autenticadas, dados de pedido, cobranças, QR Codes Pix dinâmicos, webhooks ou qualquer resposta que possa conter dados pessoais/financeiros. Configurar cache-control explícito e origin privado.

## Ordem de implementação sugerida

1. **Bloqueador:** rotacionar/remover segredos, restringir CORS e preparar TLS/headers encaminhados.
2. **Bloqueador:** validação declarativa + validação de domínio, limites de payload e rate limit para logins.
3. **Bloqueador Pix:** entidades de pagamento, idempotência persistente, webhook autenticado/reconciliado, transações/outbox e auditoria.
4. **Alta:** WAF/API gateway, observabilidade (métricas de 401/403/429, falhas de webhook, divergência de valores e latência) e alertas.
5. **Conforme escala:** CDN para mídia e load balancer com health checks, múltiplas réplicas e armazenamento/contador compartilhado.

## Critérios de aceite para liberar Pix

- Testes automatizados cobrem assinatura inválida, replay do webhook, duplicidade de `Idempotency-Key`, valor/recebedor divergente, expiração e transições inválidas.
- Teste de carga confirma `429` nos limites e que a mesma cobrança não é criada duas vezes em chamadas concorrentes.
- Teste de segurança confirma rejeição de payloads inválidos, SQL injection representativo e CORS apenas para origens aprovadas.
- Segredos não constam em Git, imagens de container ou logs; a rotação foi ensaiada.
- PSP homologado, URLs de webhook protegidas e monitoradas, e runbook de reconciliação/estorno aprovado.

## Limitações e próximos passos

Esta auditoria não certifica conformidade regulatória nem substitui pentest independente e revisão do contrato técnico do PSP escolhido. Antes do go-live, executar SAST/dependency scan, DAST autenticado em homologação, teste de carga, revisão de infraestrutura como código e threat modeling com o provedor Pix.
