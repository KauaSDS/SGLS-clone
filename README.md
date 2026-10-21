# SGLS

Sistema web para gerenciamento de uma loja de roupas.

## Branch correta

A versão final do projeto está na branch `novas-telas`.

Essa branch contém as migrations, as configurações do Docker e as alterações mais recentes do sistema.

Depois de clonar o repositório, execute:

```bash
git checkout novas-telas
```

## Tecnologias

- React, TypeScript e Vite
- ASP.NET Core 8
- Entity Framework Core
- PostgreSQL 17
- Docker Compose
- Nginx

## Como executar

Crie um arquivo `.env` na pasta principal do projeto:

```env
POSTGRES_PASSWORD=123456
JWT_KEY=uma_chave_com_pelo_menos_32_caracteres
```

Depois execute:

```bash
docker compose up --build
```

O Docker irá iniciar o banco de dados, aplicar as migrations, iniciar o back-end e iniciar o front-end.

Acesse:

- Front-end: `http://localhost:3000`
- Swagger: `http://localhost:5150/swagger`

## Comandos úteis

```bash
# Parar sem apagar os dados
docker compose stop

# Iniciar novamente
docker compose start

# Ver os containers
docker compose ps

# Ver os logs
docker compose logs -f

# Reconstruir após alterações
docker compose up --build -d
```

Para apagar tudo, incluindo o banco:

```bash
docker compose down -v --rmi local --remove-orphans
```

## Estrutura

```text
SGLS/
├── sglsbackend/
├── sglsfrontend/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Observação

Não use `docker compose down -v` quando quiser manter os dados cadastrados.
