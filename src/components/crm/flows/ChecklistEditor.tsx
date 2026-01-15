import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface ChecklistEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem("");
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          To-Do Checklist
        </h3>
      </div>

      <div className="space-y-2 mb-3">
        {items.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-4">
            No checklist items yet
          </p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 group">
              <span className="material-icons-outlined text-neutral-400 text-sm mt-0.5">
                check_box_outline_blank
              </span>
              <Input
                value={item}
                onChange={(e) => handleUpdateItem(index, e.target.value)}
                className="flex-1 text-xs bg-transparent border-none p-0 focus:ring-0 text-neutral-700 dark:text-neutral-300"
                placeholder="Checklist item..."
              />
              <button
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity"
                onClick={() => handleRemoveItem(index)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddItem();
            }
          }}
          placeholder="Add new checklist item..."
          className="flex-1 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddItem}
          disabled={!newItem.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

