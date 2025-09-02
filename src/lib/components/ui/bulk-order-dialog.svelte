<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { ShoppingCart, DollarSign, Users, AlertCircle, CheckCircle } from '@lucide/svelte';
	import type { InstagramAccount } from '$lib/api/instagramAccounts.svelte';

	interface Props {
		open: boolean;
		selectedAccounts: InstagramAccount[];
		onConfirm: (quantityMode: 'random' | 'fixed', fixedQuantity?: number) => Promise<OrderResult>;
		onCancel: () => void;
		isLoading?: boolean;
	}

	interface OrderResult {
		success: boolean;
		message: string;
		successfulOrders?: number;
		failedOrders?: number;
		totalOrders?: number;
	}

	let {
		open = $bindable(),
		selectedAccounts,
		onConfirm,
		onCancel,
		isLoading = false
	}: Props = $props();

	// État pour le mode de quantité
	let quantityMode = $state<'random' | 'fixed'>('random');
	let fixedQuantity = $state(60);

	// État pour le solde
	let balance = $state<string | null>(null);
	let loadingBalance = $state(false);

	// État pour le résultat de la commande
	let orderResult = $state<OrderResult | null>(null);

	// État de chargement local
	let localLoading = $state(false);

	// Comptes valides (avec username)
	let validAccounts = $derived(
		selectedAccounts.filter(
			(account) =>
				account.username && account.username.trim() !== '' && account.username.trim() !== 'null'
		)
	);

	// Comptes invalides (sans username)
	let invalidAccounts = $derived(
		selectedAccounts.filter(
			(account) =>
				!account.username || account.username.trim() === '' || account.username.trim() === 'null'
		)
	);

	// Fonction pour calculer le coût réel
	function calculateCost(): string {
		const avgQuantity = quantityMode === 'random' ? 60 : fixedQuantity;
		const costPerFollower = 0.0014375; // Prix réel par follower
		const cost = validAccounts.length * avgQuantity * costPerFollower;
		return cost.toFixed(2);
	}

	/**
	 * Fonction pour gérer la confirmation
	 */
	async function handleConfirm() {
		if (validAccounts.length === 0) return;

		try {
			// Activer le chargement
			localLoading = true;
			// Réinitialiser le résultat précédent
			orderResult = null;

			const result = await onConfirm(
				quantityMode,
				quantityMode === 'fixed' ? fixedQuantity : undefined
			);

			// Afficher le résultat dans le dialog
			if (result) {
				orderResult = {
					success: result.success,
					message: result.message,
					successfulOrders: result.successfulOrders,
					failedOrders: result.failedOrders,
					totalOrders: result.totalOrders
				};
			}
		} catch (error) {
			console.error('Erreur lors de la confirmation:', error);
			orderResult = {
				success: false,
				message: 'Erreur lors de la création des commandes'
			};
		} finally {
			// Désactiver le chargement
			localLoading = false;
		}
	}

	/**
	 * Fonction pour gérer l'annulation
	 */
	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}

	/**
	 * Charger le solde du compte
	 */
	async function loadBalance() {
		loadingBalance = true;
		try {
			const response = await fetch('/api/orders');
			const data = await response.json();

			if (data.success) {
				balance = data.balance;
			}
		} catch (error) {
			console.error('Erreur lors du chargement du solde:', error);
		} finally {
			loadingBalance = false;
		}
	}

	// Charger le solde quand le dialog s'ouvre
	$effect(() => {
		if (open) {
			quantityMode = 'random';
			fixedQuantity = 60;
			orderResult = null;
			localLoading = false;
			loadBalance();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header class="gap-3">
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"
				>
					<ShoppingCart class="h-5 w-5 text-green-600 flex-shrink-0" />
				</div>
				<div class="flex-1">
					<Dialog.Title class="text-lg font-semibold">Acheter des followers</Dialog.Title>
					<Dialog.Description class="text-sm text-neutral-content mt-1">
						Commande de followers Instagram pour {selectedAccounts.length} compte(s) sélectionné(s)
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Message de résultat -->
			{#if orderResult}
				{#if orderResult.success}
					<div class="bg-success/5 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<CheckCircle class="h-5 w-5 text-success" />
							<span class="text-sm font-medium text-success">Commandes créées avec succès !</span>
						</div>
						<div class="text-sm text-green-700 mt-2">
							<p>{orderResult.message}</p>
							{#if orderResult.successfulOrders !== undefined && orderResult.failedOrders !== undefined}
								<p class="mt-1">
									✅ {orderResult.successfulOrders} commande(s) réussie(s)
									{#if orderResult.failedOrders > 0}
										<br />❌ {orderResult.failedOrders} échec(s)
									{/if}
								</p>
							{/if}
						</div>
					</div>
				{:else}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<AlertCircle class="h-5 w-5 text-red-600" />
							<span class="text-sm font-medium text-red-800">Erreur lors de la commande</span>
						</div>
						<p class="text-sm text-red-700 mt-2">{orderResult.message}</p>
					</div>
				{/if}
			{/if}

			{#if !orderResult}
				<!-- Informations sur les comptes -->
				<div class="bg-base-200 border border-base-100 rounded-lg p-4">
					<div class="flex items-center gap-2 mb-2">
						<Users class="h-4 w-4 text-neutral-content" />
						<span class="text-sm font-medium text-neutral-content">Comptes sélectionnés</span>
					</div>
					<div class="text-sm">
						<p>
							<strong>{validAccounts.length}</strong> compte(s) valide(s) avec nom d'utilisateur
						</p>
						{#if invalidAccounts.length > 0}
							<p class="text-orange-600 mt-1">
								<AlertCircle class="h-3 w-3 inline mr-1" />
								{invalidAccounts.length} compte(s) ignoré(s) (pas de nom d'utilisateur)
							</p>
						{/if}
					</div>
				</div>

				<!-- Mode de quantité -->
				<div class="space-y-2">
					<span class="text-sm font-medium">Mode de quantité :</span>
					<Select.Root type="single">
						<Select.Trigger class="w-full">
							<span>
								{quantityMode === 'random' ? 'Quantité aléatoire (50-70)' : 'Quantité fixe'}
							</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="random" onclick={() => (quantityMode = 'random')}>
								Quantité aléatoire (50-70 followers)
							</Select.Item>
							<Select.Item value="fixed" onclick={() => (quantityMode = 'fixed')}>
								Quantité fixe
							</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Quantité fixe si sélectionnée -->
				{#if quantityMode === 'fixed'}
					<div class="space-y-2">
						<label for="fixed-quantity" class="text-sm font-medium">Nombre de followers :</label>
						<Input
							id="fixed-quantity"
							type="number"
							min="50"
							max="1000"
							bind:value={fixedQuantity}
							class="w-full"
							disabled={isLoading}
						/>
					</div>
				{/if}

				<!-- Informations sur le coût et le solde -->
				<div class="bg-base-300 rounded-lg p-4">
					<div class="flex items-center gap-2 mb-2">
						<DollarSign class="h-4 w-4 " />
						<span class="text-sm font-medium">Informations financières</span>
					</div>
					<div class="text-sm text-neutral-content space-y-1">
						<p>Coût total : <strong>${calculateCost()}</strong></p>
						<p>
							Solde actuel :
							{#if loadingBalance}
								<span class="text-gray-500">Chargement...</span>
							{:else if balance}
								<strong>${parseFloat(balance).toFixed(2)}</strong>
							{:else}
								<span class="text-gray-500">Non disponible</span>
							{/if}
						</p>
					</div>
				</div>

				<!-- Liste des comptes valides -->
				{#if validAccounts.length > 0}
					<div class="space-y-2">
						<span class="text-sm font-medium">Comptes qui recevront des followers :</span>
						<div class="max-h-32 overflow-y-auto bg-base-300 rounded-lg p-3">
							{#each validAccounts as account}
								<div class="flex items-center gap-2 text-sm py-1">
									<CheckCircle class="h-3 w-3 text-success" />
									<span class="font-medium">{account.username}</span>
									<span class="text-neutral-content">
										({quantityMode === 'random' ? '50-70' : fixedQuantity} followers)
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<Dialog.Footer class="gap-3">
			<Button variant="outline" onclick={handleCancel} disabled={localLoading} class="flex-1">
				{orderResult?.success ? 'Fermer' : 'Annuler'}
			</Button>
			{#if !orderResult?.success}
				<Button
					onclick={handleConfirm}
					disabled={validAccounts.length === 0 || localLoading}
					class="flex-1 bg-white hover:bg-white"
				>
					{#if localLoading}
						<div
							class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
						></div>
						Commande en cours...
					{:else}
						<ShoppingCart class="w-4 h-4 mr-2" />
						Confirmer la commande
					{/if}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
