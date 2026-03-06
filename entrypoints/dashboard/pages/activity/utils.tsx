
import {
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Task } from "@/lib/db/schema";
import { flags } from "@/lib/flags";

export const getStatusConfig = (status: Task["status"]) => {
    switch (status) {
        case "completed":
            return {
                badge: (
                    <Badge className= "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20" >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                        </Badge>
        ),
icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    color: "emerald",
      };
    case "failed":
return {
    badge: (
        <Badge className= "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/20" >
        <XCircle className="w-3 h-3 mr-1" />
            </Badge>
        ),
    icon: <XCircle className="w-5 h-5 text-red-500" />,
        color: "red",
};
    case "processing":
return {
    badge: (
        <Badge className= "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-500/20" >
        <Clock className="w-3 h-3 mr-1 animate-spin" />
            </Badge>
        ),
    icon: <Clock className="w-5 h-5 text-blue-500 animate-spin" />,
        color: "blue",
};
    default:
return {
    badge: <Badge variant="outline"> { status } </Badge>,
        icon: <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />,
        color: "gray",
};
  }
};

export const getSourceBadge = (task: Task) => {
    const isSchedule = task.inputData?.scheduleId;
    const isManualTrigger = task.inputData?.triggeredBy === "manual";

    if (isSchedule && isManualTrigger) {
        return (
            <>
            <Tooltip>
            <TooltipTrigger asChild >
            <Badge
              variant= "outline"
        className = "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-help"
            >
            <Calendar className="w-3.5 h-3.5" />
                </Badge>
                </TooltipTrigger>
                < TooltipContent > Scheduled </TooltipContent>
                </Tooltip>
                < Tooltip >
                <TooltipTrigger asChild >
                <Badge
              variant="outline"
        className = "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-help"
            >
            <Play className="w-3.5 h-3.5" />
                </Badge>
                </TooltipTrigger>
                < TooltipContent > Manual Run </TooltipContent>
                    </Tooltip>
                    </>
    );
  }

if (isSchedule) {
    return (
        <Tooltip>
        <TooltipTrigger asChild >
        <Badge
            variant= "outline"
    className = "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-help"
        >
        <Calendar className="w-3.5 h-3.5" />
            </Badge>
            </TooltipTrigger>
            < TooltipContent > Scheduled(Auto) </TooltipContent>
            </Tooltip>
    );
}
return (
    <Tooltip>
    <TooltipTrigger asChild >
    <Badge
          variant= "outline"
className = "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-help"
    >
    <Play className="w-3.5 h-3.5" />
        </Badge>
        </TooltipTrigger>
        < TooltipContent > Manual </TooltipContent>
        </Tooltip>
  );
};

export function getFlagByMarketplace(code: string | null | undefined) {
    if (!code) return null;
    const key = code.toLowerCase();
    if (Object.keys(flags).includes(key)) {
        return flags[key as keyof typeof flags];
    }
    return null;
}
