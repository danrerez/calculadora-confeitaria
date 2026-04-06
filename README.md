# Calculadora de Precificação v2.0

Acesse e teste: 'https://danrerez.github.io/calculadora-confeitaria/'

---

## 📁 Estrutura do Projeto

```
bellas-doces/
│
├── index.html           # App principal (duas abas: Calculadora + Estoque)
├── assets/
│   └── logo.png         # Logo oficial da Bella Doces
│
├── css/
│   ├── style.css        # Identidade visual, layout, responsividade
│   └── modal.css        # Estilos dos modais e sobreposições
│
├── js/
│   ├── storage.js       # Camada de dados (localStorage / sessionStorage)
│   ├── estoque.js       # CRUD da aba Estoque
│   ├── calculator.js    # Lógica das 5 etapas de precificação
│   ├── modal.js         # Controle dos modais + fluxo de adição
│   └── app.js           # Inicialização, utilitários globais, navegação
│
└── README.md
```

---

## 🚀 Como Usar

Abra o `index.html` diretamente no navegador — sem servidor, sem instalação.

Para publicar:

- **GitHub Pages** — sobe a pasta e ativa o Pages

---

## 🗂️ Abas do App

### 📦 Aba Estoque

Gerencie todos os ingredientes que a confeitaria usa, com preço real de compra.

- **Cadastrar**: Nome, qtd da embalagem, unidade, preço pago
- **Custo/unidade**: Calculado automaticamente (ex: R$ 0,006/g)
- **Editar / Excluir**: A qualquer momento
- **Buscar**: Por nome ou categoria
- **Categorias**: Massa, Calda, Recheio, Cobertura, Embalagem, Outros
- **Persistência**: Salvo permanentemente (localStorage)

### 🧮 Aba Calculadora (5 etapas)

| Etapa            | O que faz                                                          |
| ---------------- | ------------------------------------------------------------------ |
| 1 – Ingredientes | Adiciona ingredientes por seção (massa, calda, recheio, cobertura) |
| 2 – Embalagens   | Adiciona itens de embalagem (caixa, fita, tag, etc.)               |
| 3 – Mão de Obra  | Valor/hora × horas de produção                                     |
| 4 – Despesas     | Luz, água, internet, gás + 10% variável automático                 |
| 5 – Resultado    | Resumo completo + margem de lucro ajustável + preço final          |

---

## 🧮 Como adicionar ingredientes na calculadora

Clique em **"+ Adicionar ingrediente"** em qualquer seção. Um modal abre com duas opções:

### 📦 Do Estoque (recomendado)

1. Busque o ingrediente cadastrado
2. Clique nele para selecioná-lo
3. Informe a **quantidade utilizada** (ex: 250g)
4. O custo é calculado automaticamente (250 × R$ 0,006 = **R$ 1,50**)
5. Clique em **Adicionar ✓**

### ✏️ Manual

1. Digite o nome e o custo direto
2. Opcionalmente, marque **"Salvar no estoque"** para cadastrá-lo com dados completos de embalagem

---

## 🧮 Fórmulas

```
Custo por unidade = Preço da embalagem ÷ Quantidade da embalagem

Custo do ingrediente = Custo por unidade × Quantidade utilizada

Mão de Obra = Valor/hora × Horas de produção

Base variável = Ingredientes + Embalagens + Mão de Obra + Despesas Fixas

Despesas Variáveis = Base variável × 10%

Custo Total = Ingredientes + Embalagens + Mão de Obra + Fixas + Variáveis

Preço de Venda = Custo Total × (1 + Margem% / 100)
```

---

## 💾 Persistência

| Dado                    | Onde             | Quando limpa             |
| ----------------------- | ---------------- | ------------------------ |
| Estoque de ingredientes | `localStorage`   | Nunca (permanente)       |
| Dados da calculadora    | `sessionStorage` | Ao clicar "Novo Cálculo" |

---

## 🎨 Identidade Visual

| Elemento       | Valor            |
| -------------- | ---------------- |
| Rosa principal | `#E07D96`        |
| Rosa escuro    | `#C05070`        |
| Verde folha    | `#7AAD6A`        |
| Creme fundo    | `#FBF5EE`        |
| Marrom texto   | `#5A3A28`        |
| Fonte display  | Playfair Display |
| Fonte corpo    | Nunito           |

---

## 📱 Responsividade

- **Desktop** → grid 2+ colunas, layout expandido
- **Tablet** → grid colapsado, elementos empilhados
- **Mobile** → modais em bottom-sheet, botões full-width
- **Mobile XS** → navegação simplificada

---

_Desenvolvido com carinho para a Bella Doces 🎂_
