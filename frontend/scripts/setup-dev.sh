#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando configuração do ambiente de desenvolvimento...${NC}\n"

# Verificar Node.js
echo -e "Verificando versão do Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado. Por favor, instale o Node.js v18 ou superior.${NC}"
    exit 1
fi

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
npm install

# Verificar tipos do TypeScript
echo -e "\n${YELLOW}Verificando tipos TypeScript...${NC}"
npm run typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro na verificação de tipos. Por favor, corrija os erros acima.${NC}"
    exit 1
fi

# Executar testes unitários
echo -e "\n${YELLOW}Executando testes unitários...${NC}"
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}Alguns testes falharam. Por favor, verifique os erros acima.${NC}"
    exit 1
fi

# Verificar Cypress
echo -e "\n${YELLOW}Verificando instalação do Cypress...${NC}"
npx cypress verify

# Executar testes E2E em modo headless
echo -e "\n${YELLOW}Executando testes E2E...${NC}"
npm run test:e2e
if [ $? -ne 0 ]; then
    echo -e "${RED}Alguns testes E2E falharam. Por favor, verifique os erros acima.${NC}"
    exit 1
fi

# Criar arquivo .env.local se não existir
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}Criando arquivo .env.local...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}Arquivo .env.local criado. Por favor, configure as variáveis de ambiente.${NC}"
fi

# Mostrar instruções finais
echo -e "\n${GREEN}Ambiente configurado com sucesso!${NC}"
echo -e "\nPara iniciar o desenvolvimento:"
echo -e "1. Configure suas variáveis de ambiente em .env.local"
echo -e "2. Execute ${YELLOW}npm run dev${NC} para iniciar o servidor de desenvolvimento"
echo -e "3. Execute ${YELLOW}npm run cypress:open${NC} para abrir o Cypress"
echo -e "\nBom desenvolvimento! 🚀\n"