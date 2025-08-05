<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
  } from "lucide-svelte";

  let {
    currentPage,
    totalPages,
    totalAccounts,
    pageSize,
    displayInfo,
    onChangePage,
    onChangePageSize,
  } = $props<{
    currentPage: number;
    totalPages: number;
    totalAccounts: number;
    pageSize: number;
    displayInfo: string;
    onChangePage: (page: number) => void;
    onChangePageSize: (size: number) => void;
  }>();
</script>

<div
  class="flex flex-col md:flex-row justify-center space-y-2 items-center md:justify-between px-4 py-3 border-t border-gray-200 sm:px-6"
>
  <div class="flex items-center">
    <p class="text-sm text-gray-700">
      Page {currentPage} sur {totalPages || 1}
      <span class="hidden md:inline"
        >, {totalAccounts} comptes répartis dans {displayInfo}</span
      >
    </p>
    <div class="ml-2">
      <div class="flex items-center rounded-md border border-gray-200 h-8">
        <span class="px-2 text-xs text-gray-600">{pageSize}</span>
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          onclick={() => {
            onChangePageSize(
              pageSize === 5
                ? 10
                : pageSize === 10
                  ? 20
                  : pageSize === 20
                    ? 50
                    : pageSize === 50
                      ? 100
                      : 5
            );
          }}
        >
          villes par page
        </Button>
      </div>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 p-0 rounded-md"
      disabled={currentPage === 1}
      onclick={() => onChangePage(1)}
    >
      <ChevronsLeft class="h-4 w-4" />
      <span class="sr-only">Première page</span>
    </Button>
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 p-0 rounded-md"
      disabled={currentPage === 1}
      onclick={() => onChangePage(currentPage - 1)}
    >
      <ChevronLeft class="h-4 w-4" />
      <span class="sr-only">Page précédente</span>
    </Button>
    <span class="text-sm font-medium">
      Page {currentPage} sur {totalPages}
    </span>
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 p-0 rounded-md"
      disabled={currentPage === totalPages}
      onclick={() => onChangePage(currentPage + 1)}
    >
      <ChevronRight class="h-4 w-4" />
      <span class="sr-only">Page suivante</span>
    </Button>
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 p-0 rounded-md"
      disabled={currentPage === totalPages}
      onclick={() => onChangePage(totalPages)}
    >
      <ChevronsRight class="h-4 w-4" />
      <span class="sr-only">Dernière page</span>
    </Button>
  </div>
</div>
