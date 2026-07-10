"use client";

import * as React from "react";
import { Check, ChevronsUpDown, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopulationDepartement } from "@/types/population";
import { Input } from "./ui/input";

type Props = {
  departments: PopulationDepartement[];
  selectedDep: PopulationDepartement | null;
  setSelectedDep: (dep: PopulationDepartement | null) => void;
};

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export default function SelectDepartment({
  departments,
  selectedDep,
  setSelectedDep,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Ajoute "France entière" en haut de la liste
  const options = [{ id: "", nom: "France entière" }, ...departments];

  // Filtrage selon la recherche (nom ou id, insensible à la casse/accents/espaces)
  const filtered = options.filter(
    (dep) =>
      normalize(dep.nom).includes(normalize(search)) ||
      normalize(dep.id ?? "").includes(normalize(search))
  );

  // Sélectionne le département par id (toujours unique)
  const handleSelect = (depId: string) => {
    if (!depId) {
      setSelectedDep(null);
    } else {
      const found = departments.find((d) => d.id === depId);
      setSelectedDep(found ?? null);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex items-center gap-2 text-[14.5px] text-foreground border-b border-border pb-1.5 hover:border-brand hover:text-brand transition-colors cursor-pointer"
        >
          <span className="truncate max-w-[200px]">
            {selectedDep
              ? departments.find((d) => d.id === selectedDep.id)?.nom
              : "France entière"}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] md:w-[320px] p-0 bg-popover border-border rounded-lg shadow-xl">
        <Command className="bg-transparent">
          <div className="relative p-3 pb-2">
            <SearchIcon className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un département…"
              className="pl-10 pr-4 h-10 bg-transparent border-border rounded-md focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Aucun département trouvé.
            </CommandEmpty>
            <CommandGroup className="p-2">
              {filtered.map((dep) => (
                <CommandItem
                  key={dep.id || "france"}
                  value={dep.id || ""}
                  onSelect={() => handleSelect(dep.id || "")}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-hidden aria-selected:bg-accent hover:bg-accent transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {dep.nom}
                      </span>
                      {dep.id && (
                        <span className="text-xs text-muted-foreground">
                          {dep.id}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 transition-all duration-200 text-brand",
                      (selectedDep ? selectedDep.id : "") === (dep.id ?? "")
                        ? "opacity-100 scale-110"
                        : "opacity-0 scale-75"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
