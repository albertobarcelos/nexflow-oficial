import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, LayoutGrid, User, Building2, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useClientStore } from "@/stores/clientStore";
import type { GlobalSearchResult } from "@/hooks/useGlobalSearch";

const DEBOUNCE_MS = 400;

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const clientId = useClientStore((s) => s.currentClient?.id) ?? null;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [popoverClosed, setPopoverClosed] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching } = useGlobalSearch(debouncedQuery, clientId);

  // Quando o usuário digita, permite reabrir o popover
  useEffect(() => {
    if (query) setPopoverClosed(false);
  }, [query]);

  // Debounce da query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.trim().length < 2) {
      setDebouncedQuery("");
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Focar no input quando expandir
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const handleResultClick = useCallback(
    (href: string) => {
      navigate(href);
      handleClear();
      setIsExpanded(false);
    },
    [navigate, handleClear]
  );

  const handleToggleExpand = useCallback(() => {
    if (isExpanded && query) {
      handleClear();
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isExpanded, query, handleClear]);

  const showResults =
    isExpanded &&
    debouncedQuery.length >= 2 &&
    (data || isLoading || isFetching) &&
    !popoverClosed;
  const hasResults =
    data &&
    (data.cards.length > 0 ||
      data.contacts.length > 0 ||
      data.companies.length > 0 ||
      data.stageCards.length > 0);

  const renderResultItem = (item: GlobalSearchResult) => {
    const baseClass =
      "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors text-left w-full";
    const Icon =
      item.type === "card"
        ? LayoutGrid
        : item.type === "contact"
          ? User
          : item.type === "company"
            ? Building2
            : Layers;

    return (
      <button
        key={`${item.type}-${item.id}`}
        type="button"
        className={baseClass}
        onClick={() => handleResultClick(item.href)}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="truncate text-sm font-medium">{item.title}</div>
          {item.subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {item.subtitle}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative flex items-center">
      <Popover
        open={showResults}
        onOpenChange={(open) => {
          if (!open) {
            setPopoverClosed(true);
            if (!query) setIsExpanded(false);
          }
        }}
      >
        <PopoverAnchor asChild>
          <div className="flex items-center">
            {!isExpanded ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleExpand}
                className="h-9 w-9 rounded-md"
                aria-label="Abrir pesquisa"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
            ) : (
              <div className="relative w-64 transition-all duration-200">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => {
                    if (!query) {
                      setTimeout(() => {
                        if (!inputRef.current?.matches(":focus")) {
                          setIsExpanded(false);
                        }
                      }, 200);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleClear();
                      setIsExpanded(false);
                    }
                  }}
                  className="h-9 pl-8 pr-8 text-foreground placeholder:text-muted-foreground"
                />
                {(isLoading || isFetching) && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {query && !isLoading && !isFetching && (
                  <button
                    type="button"
                    onClick={handleClear}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popper-anchor-width)] max-w-[320px] p-0"
          align="end"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasResults ? (
              <div className="py-2">
                {data!.cards.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Cards
                    </div>
                    <div className="space-y-0.5">
                      {data!.cards.map((item) => renderResultItem(item))}
                    </div>
                  </div>
                )}
                {data!.stageCards.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Cards nas etapas
                    </div>
                    <div className="space-y-0.5">
                      {data!.stageCards.map((item) => renderResultItem(item))}
                    </div>
                  </div>
                )}
                {data!.contacts.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Contatos
                    </div>
                    <div className="space-y-0.5">
                      {data!.contacts.map((item) => renderResultItem(item))}
                    </div>
                  </div>
                )}
                {data!.companies.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Empresas
                    </div>
                    <div className="space-y-0.5">
                      {data!.companies.map((item) => renderResultItem(item))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
