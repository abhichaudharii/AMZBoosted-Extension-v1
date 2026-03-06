import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityPaginationProps {
  pageState: any;
  totalPages: number;
  updatePageState: (newState: any) => void;
}

export function ActivityPagination({
  pageState,
  totalPages,
  updatePageState,
}: ActivityPaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Number(pageState.page) || 1;

  return (
    <div className="flex items-center justify-center gap-2 pt-4 pb-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePageState({ page: 1 })}
        disabled={safePage === 1}
        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
      >
        «
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePageState({ page: Math.max(1, safePage - 1) })}
        disabled={safePage === 1}
        className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
      >
        <ChevronLeft className="h-3 w-3 mr-1" />
        Prev
      </Button>

      <div className="flex items-center gap-1 mx-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let n;
          if (totalPages <= 5) n = i + 1;
          else if (safePage <= 3) n = i + 1;
          else if (safePage >= totalPages - 2) n = totalPages - 4 + i;
          else n = safePage - 2 + i;

          return (
            <Button
              key={n}
              variant="ghost"
              size="sm"
              onClick={() => updatePageState({ page: n })}
              className={cn(
                "h-8 w-8 p-0 text-xs transition-all duration-300",
                safePage === n
                  ? "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 font-bold shadow-[0_0_10px_-5px_rgba(255,107,0,0.3)]"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
              )}
            >
              {n}
            </Button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          updatePageState({ page: Math.min(totalPages, safePage + 1) })
        }
        disabled={safePage === totalPages}
        className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePageState({ page: totalPages })}
        disabled={safePage === totalPages}
        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
      >
        »
      </Button>
    </div>
  );
}
