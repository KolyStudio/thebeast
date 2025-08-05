<script lang="ts">
  import { cn } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Filter } from "lucide-svelte";

  let { selectedApp, searchQuery, onChangeApp, onChangeSearch } = $props<{
    selectedApp: string;
    searchQuery: string;
    onChangeApp: (app: string) => void;
    onChangeSearch: (query: string) => void;
  }>();
</script>

<div class="flex items-center gap-2">
  <!-- Barre de recherche -->
  <div class="relative hidden md:block">
    <Input
      type="text"
      placeholder="Rechercher une ville..."
      class="h-9 pr-8 w-40 md:w-64"
      value={searchQuery}
      onInput={(e) => onChangeSearch(e.currentTarget.value)}
    />
    {#if searchQuery}
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        onclick={() => onChangeSearch("")}
      >
        ×
      </button>
    {/if}
  </div>
  <!-- Filtres d'applications -->
  <div class="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl">
    <button
      class={cn(
        "px-3 py-1 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors",
        selectedApp === "all" ? "bg-white shadow-sm" : "hover:bg-gray-200"
      )}
      onclick={() => onChangeApp("all")}
    >
      <Filter class="w-4 h-4" />
      Tous
    </button>
    <button
      class={cn(
        "px-3 py-1 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors",
        selectedApp === "fruitz" ? "bg-white shadow-sm" : "hover:bg-gray-200"
      )}
      onclick={() => onChangeApp("fruitz")}
    >
      <img src="/fruitz.png" alt="Fruitz" class="w-4 h-4" />
      Fruitz
    </button>
    <button
      class={cn(
        "px-3 py-1 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors",
        selectedApp === "happn" ? "bg-white shadow-sm" : "hover:bg-gray-200"
      )}
      onclick={() => onChangeApp("happn")}
    >
      <img src="/happn.png" alt="Happn" class="w-4 h-4" />
      Happn
    </button>
  </div>
</div>
