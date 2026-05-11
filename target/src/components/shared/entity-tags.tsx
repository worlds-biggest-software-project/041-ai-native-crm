"use client";

import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface EntityTagsProps {
  tags: Tag[];
  onRemove?: (tagId: string) => void;
  onAdd?: () => void;
}

export function EntityTags({ tags, onRemove, onAdd }: EntityTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="gap-1"
          style={{ backgroundColor: tag.color, color: "#fff" }}
        >
          {tag.name}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(tag.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/20"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {onAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-6 gap-1 px-2 text-xs"
        >
          <Plus className="h-3 w-3" />
          Add tag
        </Button>
      )}
    </div>
  );
}
