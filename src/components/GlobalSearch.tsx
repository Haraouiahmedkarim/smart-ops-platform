import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  type: 'robot' | 'equipment' | 'work_order';
  name: string;
  code: string;
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const searchAll = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const searchTerm = `%${query}%`;
      const [robots, equipment, workOrders] = await Promise.all([
        supabase.from('robots').select('id, name, code').ilike('name', searchTerm).limit(5),
        supabase.from('equipment').select('id, name, code').ilike('name', searchTerm).limit(5),
        supabase.from('work_orders').select('id, title, equipment_id').ilike('title', searchTerm).limit(5),
      ]);

      const combined: SearchResult[] = [
        ...(robots.data || []).map(r => ({ ...r, type: 'robot' as const })),
        ...(equipment.data || []).map(e => ({ ...e, type: 'equipment' as const })),
        ...(workOrders.data || []).map(w => ({ ...w, name: w.title, code: w.equipment_id, type: 'work_order' as const })),
      ];

      setResults(combined);
    };

    const timer = setTimeout(searchAll, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'robot') navigate(`/robots/${result.id}`);
    else if (result.type === 'equipment') navigate(`/equipment`);
    else navigate(`/work-orders`);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-64 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="absolute right-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search robots, equipment, work orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="mt-4 space-y-2">
            {results.map(result => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors"
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-muted-foreground">{result.type} • {result.code}</div>
              </button>
            ))}
            {query && results.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No results found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
