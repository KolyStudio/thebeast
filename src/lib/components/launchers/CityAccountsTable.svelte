<script lang="ts">
  import { Trash2 } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  let { group, onDelete, formatDate } = $props<{
    group: any;
    onDelete: (id: string) => void;
    formatDate: (date: Date) => string;
  }>();

  let accountToDelete = $state<string | null>(null);
</script>

<div class="mb-6 last:mb-2">
  <!-- City header in the modern style shown in the image -->
  <div
    class="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl border border-gray-200"
  >
    <div class="flex items-center gap-2">
      <img src="/flags/s/FR.svg" alt="France" class="w-4 h-3 rounded-sm" />
      <h3 class="font-semibold text-gray-800 uppercase text-sm">
        {group.city}
      </h3>
    </div>

    <!-- Stats in the modern style shown in the image -->
    <div class="flex items-center gap-5">
      <div class="flex items-center">
        <span class="text-gray-600 font-bold text-sm"
          >{group.accounts.length} comptes</span
        >
      </div>
      <div class="hidden md:flex items-center space-x-2">
        {#if group.fruitzCount > 0}
          <div
            class="px-2 py-0.5 flex items-center gap-1 bg-pink-100 rounded-full text-xs text-pink-600 font-medium"
          >
            <img src="/fruitz.png" alt="Fruitz" class="w-5 h-5" />
            {group.fruitzCount}
          </div>
        {/if}
        {#if group.happnCount > 0}
          <div
            class="px-2 py-0.5 flex items-center gap-1 bg-blue-100 rounded-full text-xs text-blue-600 font-medium"
          >
            <img src="/happn.png" alt="Happn" class="w-5 h-5" />
            {group.happnCount}
          </div>
        {/if}
      </div>
      <div class="items-center gap-2 hidden md:flex">
        <div class="flex">
          {#each Array(10) as _, i}
            <div
              class={`w-1 h-4 mx-px rounded-sm ${i < 8 ? "bg-purple-400" : "bg-gray-200"}`}
            ></div>
          {/each}
        </div>
        <span
          class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full"
          >8/10</span
        >
      </div>
    </div>
  </div>

  <!-- Table for this city's accounts with all accounts for this city -->
  <table class="w-full text-sm border border-y-0 md:table-fixed">
    <thead class="text-xs text-gray-500 uppercase">
      <tr class="border-b border-gray-200">
        <th class="px-4 py-3 text-left w-[8%] hidden md:table-cell">App</th>
        <th class="px-4 py-3 text-left w-[13%]">Statut</th>
        <th class="px-4 py-3 text-left w-[10%] hidden md:table-cell">Date</th>
        <th class="px-4 py-3 text-left w-[15%] hidden md:table-cell">Modèle</th>
        <th class="px-4 py-3 text-left w-[14%] hidden md:table-cell">Likes</th>
        <th class="px-4 py-3 text-left">Notes</th>
        <th class="px-4 py-3 text-left w-[10%]">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each group.accounts as account, i}
        <!-- Insertion d'un séparateur visuel si l'application change -->
        {#if i > 0 && (account.application || "fruitz") !== (group.accounts[i - 1].application || "fruitz")}
          <tr class="">
            <td colspan="7" class="px-4 py-2 border-y border-gray-200">
              <div class="flex items-center gap-2">
                <img
                  src="/{account.application || 'fruitz'}.png"
                  alt={account.application || "fruitz"}
                  class="w-4 h-4"
                />
                <span class="text-xs font-medium text-gray-600">
                  {account.application === "fruitz" ? "Fruitz" : "Happn"}
                </span>
              </div>
            </td>
          </tr>
        {:else if i === 0}
          <!-- Afficher le séparateur pour le premier groupe -->
          <tr class="bg-gray-50">
            <td colspan="7" class="px-4 py-2 border-y border-gray-200">
              <div class="flex items-center gap-2">
                <img
                  src="/{account.application || 'fruitz'}.png"
                  alt={account.application || "fruitz"}
                  class="w-4 h-4"
                />
                <span class="text-xs font-medium text-gray-600">
                  {account.application === "fruitz" ? "Fruitz" : "Happn"}
                </span>
              </div>
            </td>
          </tr>
        {/if}

        <tr class="rounded-b-xl border-b border-gray-100 hover:bg-white">
          <td class="px-4 py-3 align-middle hidden md:table-cell">
            <img
              src="/{account.application || 'fruitz'}.png"
              alt={account.application || "fruitz"}
              class="w-5 h-5"
            />
          </td>
          <td class="px-4 py-3 align-middle">
            <div class="flex items-center">
              <div
                class={cn(
                  "h-6 px-2.5 py-1 rounded-md inline-flex items-center",
                  account.statut === "actif"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : account.statut === "Inactif"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-gray-100 text-gray-800 border border-gray-300"
                )}
              >
                <div
                  class={cn(
                    "w-2 h-2 rounded-full mr-1.5",
                    account.statut === "actif"
                      ? "bg-green-600"
                      : account.statut === "Inactif"
                        ? "bg-red-600"
                        : "bg-gray-600"
                  )}
                ></div>
                <span class="text-xs font-medium leading-none">
                  {account.statut || "Non défini"}
                </span>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-gray-700 align-middle hidden md:table-cell"
            >{account.created
              ? formatDate(new Date(account.created))
              : "--/--"}</td
          >
          <td class="px-4 py-3 font-medium align-middle hidden md:table-cell"
            >{account.model_name || account.prenom || "N/A"}</td
          >
          <td class="px-4 py-3 align-middle hidden md:table-cell">
            <div class="flex items-center gap-1">
              {#if account.likes && account.likes > 0}
                {#each Array(Math.min(account.likes, 5)) as _, i}
                  <span class="bg-gray-200 p-1 rounded-full"></span>
                {/each}
                {#if account.likes > 5}
                  <span class="text-xs text-gray-500 ml-1"
                    >+{account.likes - 5}</span
                  >
                {/if}
              {:else}
                <span class="text-xs text-gray-500">0</span>
              {/if}
            </div>
          </td>
          <td class="px-4 py-3 text-gray-600 align-middle hidden md:table-cell"
            >{account.notes || "Pas de notes"}</td
          >
          <td class="px-4 py-3 align-middle">
            <div class="flex items-center gap-2">
              <AlertDialog.Root
                open={accountToDelete === account.id}
                onOpenChange={(open) => !open && (accountToDelete = null)}
              >
                <AlertDialog.Trigger>
                  <button
                    class="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                    type="button"
                    onclick={() => (accountToDelete = account.id)}
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Header>
                    <AlertDialog.Title
                      >Confirmation de suppression</AlertDialog.Title
                    >
                    <AlertDialog.Description>
                      Êtes-vous sûr de vouloir supprimer ce compte ? Cette
                      action est irréversible.
                    </AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer>
                    <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                    <AlertDialog.Action
                      class="bg-red-500 hover:bg-red-600 text-white"
                      onclick={() => onDelete(account.id)}
                      >Supprimer</AlertDialog.Action
                    >
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
