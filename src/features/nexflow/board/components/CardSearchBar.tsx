import { useRef, useEffect, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

interface CardSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchingOnServer: boolean;
  setIsSearchingOnServer: (isSearching: boolean) => void;
  serverSearchResults: NexflowCard[];
  setServerSearchResults: (results: NexflowCard[]) => void;
  searchCardsOnServer?: (query: string, stepId: string) => Promise<NexflowCard[]>;
  steps: NexflowStepWithFields[];
}

export function CardSearchBar({
  searchQuery,
  setSearchQuery,
  isSearchingOnServer,
  setIsSearchingOnServer,
  serverSearchResults,
  setServerSearchResults,
  searchCardsOnServer,
  steps,
}: CardSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  // Focar no input quando expandir
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Limpar timer anterior se existir
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    // Se o termo for muito curto, limpar resultados do servidor imediatamente
    if (value.trim().length < 3) {
      setServerSearchResults([]);
      return;
    }

    // Debounce: aguardar 500ms antes de buscar no servidor
    searchDebounceTimerRef.current = setTimeout(async () => {
      if (searchCardsOnServer) {
        setIsSearchingOnServer(true);

        try {
          // Buscar em todas as etapas
          const allStepIds = steps.map((step) => step.id);
          const allResults: NexflowCard[] = [];
          
          for (const stepId of allStepIds) {
            const stepResults = await searchCardsOnServer(value.trim(), stepId);
            allResults.push(...stepResults);
          }
          
          setServerSearchResults(allResults);
        } catch (error) {
          console.error("Erro ao buscar no servidor:", error);
          setServerSearchResults([]);
        } finally {
          setIsSearchingOnServer(false);
        }
      }
    }, 500);
  };

  const handleClear = () => {
    setSearchQuery("");
    setServerSearchResults([]);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
  };

  const handleToggleExpand = () => {
    if (isExpanded && searchQuery) {
      // Se estiver expandido e houver query, limpar e colapsar
      handleClear();
      setIsExpanded(false);
    } else {
      // Expandir
      setIsExpanded(true);
    }
  };

  // Se houver query, manter expandido
  useEffect(() => {
    if (searchQuery && !isExpanded) {
      setIsExpanded(true);
    }
  }, [searchQuery, isExpanded]);

  return (
    <div className="relative flex items-center search-container">
      {!isExpanded ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleExpand}
          className="h-9 w-9 rounded-md"
          aria-label="Abrir pesquisa"
        >
          <Search className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      ) : (
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar em todas as etapas..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onBlur={(e) => {
              // Não colapsar se houver query
              if (!searchQuery) {
                // Pequeno delay para permitir cliques em botões dentro do campo
                setTimeout(() => {
                  if (!inputRef.current?.matches(':focus')) {
                    setIsExpanded(false);
                  }
                }, 200);
              }
            }}
            className="h-9 pl-8 pr-8 text-sm"
          />
          {isSearchingOnServer && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          )}
          {searchQuery && !isSearchingOnServer && (
            <button
              onClick={handleClear}
              onMouseDown={(e) => e.preventDefault()} // Prevenir blur antes do click
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

