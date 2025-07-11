"use client";

import * as React from "react";
import { Check, ChevronsUpDown, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    .replace(/[\u0300-\u036f]/g, "")
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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] md:w-[320px] justify-between bg-gradient-to-r from-gray-900/80 to-gray-800/60 border-gray-700/50 hover:border-gray-600/60 hover:from-gray-800/90 hover:to-gray-700/70 rounded-xl px-4 py-2.5 text-white shadow-lg backdrop-blur-sm transition-all duration-300 group"
        >
          <span className="truncate text-sm font-medium">
            {selectedDep
              ? departments.find((d) => d.id === selectedDep.id)?.nom
              : "France entière"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60 group-hover:opacity-80 transition-opacity duration-200" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] md:w-[320px] p-0 bg-gradient-to-br from-gray-900/95 to-gray-800/90 border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-md">
        <Command className="bg-transparent">
          <div className="relative p-3 pb-2">
            <SearchIcon className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un département…"
              className="pl-10 pr-4 h-10 bg-gray-800/50 border-gray-600/50 rounded-lg text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800/20 scrollbar-thumb-gray-600/40">
            <CommandEmpty className="py-6 text-center text-sm text-gray-400">
              Aucun département trouvé.
            </CommandEmpty>
            <CommandGroup className="p-2">
              {filtered.map((dep) => (
                <CommandItem
                  key={dep.id || "france"}
                  value={dep.id || ""}
                  onSelect={() => handleSelect(dep.id || "")}
                  className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-hidden aria-selected:bg-gradient-to-r aria-selected:from-blue-600/20 aria-selected:to-purple-600/20 aria-selected:text-white hover:bg-gray-700/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col">
                      <span className="font-medium text-white group-hover:text-blue-200 transition-colors duration-200">
                        {dep.nom}
                      </span>
                      {dep.id && (
                        <span className="text-xs text-gray-400 group-hover:text-gray-300">
                          {dep.id}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 transition-all duration-200",
                      (selectedDep ? selectedDep.id : "") === (dep.id ?? "")
                        ? "opacity-100 text-blue-400 scale-110"
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
