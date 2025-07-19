// AIDEV-NOTE: Hook personalizado para verificar media queries

import * as React from "react";

/**
 * Hook personalizado para verificar se uma media query corresponde ao estado atual da tela
 * @param query String de media query (ex: "(min-width: 768px)")
 * @returns Boolean indicando se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Define o estado inicial
    setMatches(mediaQuery.matches);
    
    // Função para atualizar o estado quando a media query mudar
    const onChange = () => setMatches(mediaQuery.matches);
    
    // Adiciona o listener para mudanças na media query
    mediaQuery.addEventListener("change", onChange);
    
    // Cleanup: remove o listener quando o componente for desmontado
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [query]); // Re-executa o efeito se a query mudar

  return matches;
}