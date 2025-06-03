import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBulkFollowersOrders, generateRandomQuantity, getBalance } from '$lib/api/justAnotherPanel';

export interface BulkOrderRequest {
	accounts: Array<{
		id: number;
		username: string;
	}>;
	quantityMode: 'random' | 'fixed';
	fixedQuantity?: number;
}

export interface BulkOrderResponse {
	success: boolean;
	message: string;
	results?: Array<{
		username: string;
		success: boolean;
		orderId?: number;
		error?: string;
		quantity: number;
	}>;
	balance?: string;
	totalOrders?: number;
	successfulOrders?: number;
	failedOrders?: number;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: BulkOrderRequest = await request.json();

		// Validation des données
		if (!body.accounts || !Array.isArray(body.accounts) || body.accounts.length === 0) {
			return json({
				success: false,
				message: 'Aucun compte fourni pour la commande'
			} as BulkOrderResponse, { status: 400 });
		}

		// Vérifier que tous les comptes ont un username
		const accountsWithUsername = body.accounts.filter(account => 
			account.username && account.username.trim() !== ''
		);

		if (accountsWithUsername.length === 0) {
			return json({
				success: false,
				message: 'Aucun compte avec un nom d\'utilisateur valide'
			} as BulkOrderResponse, { status: 400 });
		}

		if (accountsWithUsername.length !== body.accounts.length) {
			console.warn(`${body.accounts.length - accountsWithUsername.length} comptes ignorés car sans nom d'utilisateur`);
		}

		// Préparer les commandes avec les quantités
		const ordersToCreate = accountsWithUsername.map(account => ({
			username: account.username,
			quantity: body.quantityMode === 'random' 
				? generateRandomQuantity() 
				: (body.fixedQuantity || generateRandomQuantity())
		}));

		console.log(`Création de ${ordersToCreate.length} commandes de followers...`);

		// Obtenir le solde avant les commandes
		let initialBalance: string | undefined;
		try {
			const balanceResponse = await getBalance();
			initialBalance = balanceResponse.balance;
		} catch (error) {
			console.warn('Impossible de récupérer le solde:', error);
		}

		// Créer les commandes en bulk
		const results = await createBulkFollowersOrders(ordersToCreate);

		// Calculer les statistiques
		const successfulOrders = results.filter(r => r.success).length;
		const failedOrders = results.filter(r => !r.success).length;

		// Enrichir les résultats avec les quantités
		const enrichedResults = results.map(result => {
			const originalOrder = ordersToCreate.find(order => order.username === result.username);
			return {
				...result,
				quantity: originalOrder?.quantity || 0
			};
		});

		// Obtenir le solde après les commandes
		let finalBalance: string | undefined;
		try {
			const balanceResponse = await getBalance();
			finalBalance = balanceResponse.balance;
		} catch (error) {
			console.warn('Impossible de récupérer le solde final:', error);
		}

		const response: BulkOrderResponse = {
			success: successfulOrders > 0,
			message: `${successfulOrders} commande(s) créée(s) avec succès, ${failedOrders} échec(s)`,
			results: enrichedResults,
			balance: finalBalance || initialBalance,
			totalOrders: results.length,
			successfulOrders,
			failedOrders
		};

		console.log('Résultats des commandes bulk:', {
			total: results.length,
			success: successfulOrders,
			failed: failedOrders,
			balance: finalBalance
		});

		return json(response);

	} catch (error) {
		console.error('Erreur lors du traitement des commandes bulk:', error);
		
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Erreur interne du serveur'
		} as BulkOrderResponse, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		// Endpoint pour obtenir le solde
		const balanceResponse = await getBalance();
		
		return json({
			success: true,
			balance: balanceResponse.balance,
			currency: balanceResponse.currency || 'USD'
		});
	} catch (error) {
		console.error('Erreur lors de la récupération du solde:', error);
		
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Erreur lors de la récupération du solde'
		}, { status: 500 });
	}
};
