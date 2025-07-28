<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Instagram, Loader2 } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { proxiesStore, type Proxy } from '$lib/api/proxies.svelte';

	interface Props {
		open: boolean;
		selectedProxy: Proxy | null;
		onClose: () => void;
	}

	let { open = $bindable(), selectedProxy, onClose }: Props = $props();

	// Valeurs par défaut pour le proxy
	let proxyData = $state({
		type: 'http' as 'http' | 'https' | 'socks4' | 'socks5',
		host: '',
		port: '',
		username: '',
		password: '',
		proxy_renew_url: '',
		proxy_renew_port: ''
	});

	// Réinitialiser les données quand selectedProxy change
	$effect(() => {
		if (selectedProxy) {
			proxyData = {
				type: selectedProxy.type,
				host: selectedProxy.host,
				port: selectedProxy.port,
				username: selectedProxy.username || '',
				password: selectedProxy.password || '',
				proxy_renew_url: selectedProxy.proxy_renew_url || '',
				proxy_renew_port: selectedProxy.proxy_renew_port || ''
			};
		} else {
			// Réinitialiser pour un nouveau proxy
			proxyData = {
				type: 'http',
				host: '',
				port: '',
				username: '',
				password: '',
				proxy_renew_url: '',
				proxy_renew_port: ''
			};
		}
	});

	async function handleSave() {
		if (!proxyData.host || !proxyData.port) {
			alert("Veuillez remplir au moins l'adresse et le port du proxy.");
			return;
		}

		try {
			if (selectedProxy) {
				// Modification d'un proxy existant
				await proxiesStore.updateProxy(selectedProxy.id, proxyData);
			} else {
				// Création d'un nouveau proxy
				await proxiesStore.createProxy(proxyData);
			}
			onClose();
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
		}
	}

	function handleCancel() {
		onClose();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<div class="flex space-x-3">
				<div
					class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
				>
					<Instagram class="h-5 w-5" />
				</div>
				<div>
					<h1 class="font-medium">
						{selectedProxy ? 'Éditer le proxy' : 'Ajouter un proxy'}
					</h1>
					<h2 class="text-neutral-content text-sm">
						{selectedProxy ? 'Modifiez les informations du proxy.' : 'Configurez un nouveau proxy.'}
					</h2>
				</div>
			</div>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- Type -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Type</Label>
				<Select.Root type="single" bind:value={proxyData.type}>
					<Select.Trigger class="w-full">
						<span>{proxyData.type.toUpperCase()}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="http">HTTP</Select.Item>
						<Select.Item value="https">HTTPS</Select.Item>
						<Select.Item value="socks4">SOCKS4</Select.Item>
						<Select.Item value="socks5">SOCKS5</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Adresse -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">
					Adresse <span class="text-red-500">*</span>
				</Label>
				<Input bind:value={proxyData.host} placeholder="exemple: proxy.example.com" />
			</div>

			<!-- Port -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">
					Port <span class="text-red-500">*</span>
				</Label>
				<Input bind:value={proxyData.port} placeholder="exemple: 8080" />
			</div>

			<!-- Utilisateur -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Utilisateur</Label>
				<Input bind:value={proxyData.username} placeholder="Nom d'utilisateur (optionnel)" />
			</div>

			<!-- Mot de passe -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Mot de passe</Label>
				<Input
					bind:value={proxyData.password}
					type="password"
					placeholder="Mot de passe (optionnel)"
				/>
			</div>

			<!-- URL Renew IP -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">URL Renew IP</Label>
				<Input
					bind:value={proxyData.proxy_renew_url}
					placeholder="URL pour renouveler l'IP (optionnel)"
				/>
			</div>

			<!-- Port Renew IP -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Port Renew IP</Label>
				<Input
					bind:value={proxyData.proxy_renew_port}
					placeholder="Port pour renouveler l'IP (optionnel)"
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={handleCancel}
				disabled={proxiesStore.isLoading.create || proxiesStore.isLoading.update}
			>
				Annuler
			</Button>
			<Button
				onclick={handleSave}
				disabled={proxiesStore.isLoading.create || proxiesStore.isLoading.update}
				class="gap-2 bg-white hover:bg-white"
			>
				{#if proxiesStore.isLoading.create || proxiesStore.isLoading.update}
					<Loader2 class="h-4 w-4 animate-spin" />
				{/if}
				{selectedProxy ? 'Sauvegarder' : 'Ajouter un proxy'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
