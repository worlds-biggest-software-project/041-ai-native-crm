"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandContextValue {
  search: string;
  setSearch: (search: string) => void;
}

const CommandContext = React.createContext<CommandContextValue>({
  search: "",
  setSearch: () => {},
});

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [search, setSearch] = React.useState("");

  return (
    <CommandContext.Provider value={{ search, setSearch }}>
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
});
Command.displayName = "Command";

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function CommandDialog({ open, onOpenChange, children }: CommandDialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
        <Command className="relative z-50 w-full max-w-lg border shadow-lg">
          {children}
        </Command>
      </div>
    </div>
  );
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const { search, setSearch } = React.useContext(CommandContext);

  return (
    <div className="flex items-center border-b px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = "CommandList";

function CommandEmpty({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "py-6 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? "No results found."}
    </div>
  );
}

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-hidden p-1 text-foreground", className)}
      {...props}
    >
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      {children}
    </div>
  ),
);
CommandGroup.displayName = "CommandGroup";

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  onSelect?: () => void;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, disabled, onSelect, onClick, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      aria-disabled={disabled}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        onSelect?.();
      }}
      {...props}
    />
  ),
);
CommandItem.displayName = "CommandItem";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};
