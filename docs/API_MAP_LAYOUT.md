# Layout do Mapa de APIs – NextFlow CRM

Este documento descreve as alterações e o novo esquema de layout aplicado em `docs/api-map.json`, bem como como visualizar e exportar um screenshot do resultado.

## Objetivos de layout e visualização

- Espaçamento uniforme e balanceado entre cards (flows e endpoints).
- Ausência de sobreposição entre elementos e preservação de hierarquias.
- Zoom e pan para navegação do diagrama.
- Proporções adequadas e legibilidade dos textos.
- Redimensionamento responsivo via `viewBox` no SVG.

## Estrutura adicionada ao JSON

Foi mantida a estrutura original do arquivo, com a adição de duas chaves no topo:

- `layoutConfig`: parâmetros de configuração do layout.
  - `minSpacingCm`: espaçamento mínimo lógico entre elementos.
  - `groupRadiusFactor`, `endpointRadiusFactor`, `flowRadiusFactor`: fatores de distribuição para algoritmos (usados pela visualização em casos sem coordenadas explícitas).
  - `textSizePx`: tamanho base da tipografia (Poppins).

- `layout`: coordenadas explícitas para garantir uniformidade e evitar sobreposição.
  - `canvas`: dimensões base do desenho.
  - `groups`: posição (`cx`, `cy`) e raio (`r`) por grupo.
  - `flows`: posição (`x`, `y`) de cada fluxo.
  - `nodes`: posição (`x`, `y`) de cada endpoint.

As conexões (`links`) e a hierarquia foram preservadas integralmente, sem alterações na estrutura das listas existentes.

## Visualização

Foi adicionada a página `docs/request-map.html` que:

- Carrega `docs/api-map.json` e desenha o diagrama em SVG usando D3.js.
- Aplica tipografia Poppins globalmente, conforme o Design System do projeto.
- Implementa zoom e pan (scroll e arraste) e botão de reset de zoom.
- Exibe um overlay de erro caso o JSON não seja carregado.
- Possui botão “Salvar PNG” para exportar um screenshot do diagrama.

### Como abrir o preview

1. Inicie o servidor de desenvolvimento (Vite):
   - `npm run dev`
2. Abra no navegador:
   - `http://localhost:8081/docs/request-map.html`

Observação: a porta pode variar conforme disponibilidade local; verifique o terminal do Vite.

### Como gerar o screenshot

- Clique no botão “Salvar PNG” na barra superior da visualização.
- O arquivo será baixado como `nextflow-api-map.png`.

## Notas de responsividade e legibilidade

- O SVG utiliza `viewBox`, garantindo ajuste automático à janela do navegador.
- O tamanho base dos textos pode ser ajustado via `layoutConfig.textSizePx`.
- Caso deseje trabalhar sem coordenadas explícitas, os fatores em `layoutConfig` orientam um algoritmo radial e em anéis para distribuir elementos sem sobreposição.

## Considerações sobre Poppins

- A página `request-map.html` importa a família Poppins de forma explícita e aplica `font-family: Poppins` globalmente, seguindo as regras do projeto.
- Não há fallback configurado; em caso de falha de carregamento de fontes, o navegador aplicará um default, mas essa condição é tratada como exceção.