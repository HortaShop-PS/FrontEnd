# Frontend

<div align="center">
  <img src="/assets/images/logo/hortaShop.png" alt="logo" style="height: 5cm;">
</div>

- Índice
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração do Projeto](#configuração-do-projeto)
    - [1. Clone o repositório](#1-clone-o-repositório)
    - [2. Inicialize o Git Flow](#2-inicialize-o-git-flow)
    - [3. Instale as dependências](#3-instale-as-dependências)
    - [4. Inicie o projeto](#4-inicie-o-projeto)
  - [Fluxo de Trabalho com Git Flow](#fluxo-de-trabalho-com-git-flow)
    - [1. Criar uma nova feature](#1-criar-uma-nova-feature)
    - [2. Trabalhar na feature](#2-trabalhar-na-feature)
    - [3. Finalizar a feature](#3-finalizar-a-feature)


[Voltar ao README principal](https://github.com/HortaShop-PS)


Este é o repositório do FrontEnd do projeto Hortashop, desenvolvido com [Expo](https://expo.dev) e [React Native](https://reactnative.dev/). Este guia irá ajudar a configurar o ambiente, rodar o projeto e seguir o fluxo de trabalho com Git Flow.

## Pré-requisitos

Antes de começar, certifique-se de ter os seguintes itens instalados:

1. **Git**: [Instalar Git](https://git-scm.com/)
2. **Node.js**: [Instalar Node.js](https://nodejs.org/) (recomendado: versão LTS)
3. **Expo CLI**: Instale globalmente com o comando:
   ```bash
   npm install -g expo-cli
   ```

## Configuração do Projeto

### 1. Clone o repositório

Clone o repositório para sua máquina local:

```bash
git clone https://github.com/HortaShop-PS/FrontEnd.git
```

### 2. Inicialize o Git Flow

Inicialize o Git Flow no repositório:

```bash
git flow init
```

Durante a inicialização, você pode aceitar as configurações padrão pressionando `Enter` para cada pergunta.

### 3. Instale as dependências

Instale as dependências do projeto:

```bash
npm install
```

### 4. Inicie o projeto

Inicie o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

No terminal, você verá opções para abrir o app em:

- Pelo aplicativo Expo Go no seu celular: escaneie o QR code com a câmera do celular ou com o aplicativo Expo Go. Disponivel para Android e iOS.

## Fluxo de Trabalho com Git Flow

### 1. Pull para verificar atualizações

Antes de começar a trabalhar em uma nova funcionalidade, sempre faça um pull das últimas alterações da branch `develop`:

```bash
git checkout develop
git pull origin develop
```
Isso garante que você esteja trabalhando com a versão mais recente do código.

### 2. Criar uma nova feature

Para começar a trabalhar em uma nova funcionalidade, crie uma branch de feature:

```bash
git flow feature start nome-da-feature
```

Isso criará uma nova branch baseada na branch `develop`.

### 3. Trabalhar na feature

Implemente as alterações necessárias no código. Lembre-se de fazer commits regularmente:

```bash
git add .
git commit -m "Descrição do commit"
```

### 4. Finalizar a feature

Quando terminar de implementar e testar a funcionalidade, finalize a branch de feature:

```bash
git flow feature finish nome-da-feature
```

Isso fará o merge da branch de feature na branch `develop` e deletará a branch de feature local.
