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
          className="w-[260px] justify-between mb-4"
        >
          {selectedDep
            ? departments.find((d) => d.id === selectedDep.id)?.nom
            : "France entière"}
          <ChevronsUpDown className="opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          {/* <CommandInput
            placeholder="Rechercher un département…"
            className="h-9"
            onValueChange={setSearch}
          /> */}
          <div className="relative">
            <SearchIcon className="size-4 shrink-0 opacity-50 absolute top-1/4 left-1" />
            <Input
              type="text"
              placeholder="Rechercher un département…"
              className="pl-6 pr-2 mb-2 placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>Aucun département trouvé.</CommandEmpty>
            <CommandGroup>
              {filtered.map((dep) => (
                <CommandItem
                  key={dep.id || "france"}
                  value={dep.id || ""}
                //   onSelect={() => handleSelect(dep.id || "")}
                  onSelect={() => handleSelect(normalize(dep.id))}
                >
                  {dep.nom}
                  <Check
                    className={cn(
                      "ml-auto",
                      (selectedDep ? selectedDep.id : "") === (dep.id ?? "")
                        ? "opacity-100"
                        : "opacity-0"
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
