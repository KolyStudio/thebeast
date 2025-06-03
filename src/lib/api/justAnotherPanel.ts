/**
 * JustAnotherPanel API service
 * Documentation: https://justanotherpanel.com/api
 */

const API_BASE_URL = 'https://justanotherpanel.com/api/v2';
const API_KEY = '13e35de821db207ccd4adfe364a5ccc6';

export interface OrderRequest {
	action: 'add';
	service: number;
	link: string;
	quantity: number;
}

export interface OrderResponse {
	order?: number;
	error?: string;
	success?: boolean;
}

export interface ServiceInfo {
	service: number;
	name: string;
	type: string;
	rate: string;
	min: string;
	max: string;
	description?: string;
}

export interface BalanceResponse {
	balance?: string;
	currency?: string;
	error?: string;
}

/**
 * Créer une commande de followers Instagram
 */
export async function createFollowersOrder(
	instagramUsername: string,
	quantity: number
): Promise<OrderResponse> {
	try {
		// Nettoyer le nom d'utilisateur (enlever @ si présent)
		const cleanUsername = instagramUsername.replace('@', '');
		const instagramLink = `https://instagram.com/${cleanUsername}`;

		const orderData: OrderRequest = {
			action: 'add',
			service: 471, // Service ID pour les followers Instagram
			link: instagramLink,
			quantity: quantity
		};

		const formData = new FormData();
		formData.append('key', API_KEY);
		formData.append('action', orderData.action);
		formData.append('service', orderData.service.toString());
		formData.append('link', orderData.link);
		formData.append('quantity', orderData.quantity.toString());

		const response = await fetch(API_BASE_URL, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: OrderResponse = await response.json();

		if (result.error) {
			throw new Error(result.error);
		}

		return result;
	} catch (error) {
		console.error('Erreur lors de la création de la commande:', error);
		throw error;
	}
}

/**
 * Créer plusieurs commandes en bulk
 */
export async function createBulkFollowersOrders(
	accounts: Array<{ username: string; quantity: number }>
): Promise<Array<{ username: string; success: boolean; orderId?: number; error?: string }>> {
	const results = [];

	for (const account of accounts) {
		try {
			const result = await createFollowersOrder(account.username, account.quantity);
			
			if (result.order) {
				results.push({
					username: account.username,
					success: true,
					orderId: result.order
				});
			} else {
				results.push({
					username: account.username,
					success: false,
					error: result.error || 'Erreur inconnue'
				});
			}

			// Délai entre les requêtes pour éviter le rate limiting
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (error) {
			results.push({
				username: account.username,
				success: false,
				error: error instanceof Error ? error.message : 'Erreur inconnue'
			});
		}
	}

	return results;
}

/**
 * Obtenir le solde du compte
 */
export async function getBalance(): Promise<BalanceResponse> {
	try {
		const formData = new FormData();
		formData.append('key', API_KEY);
		formData.append('action', 'balance');

		const response = await fetch(API_BASE_URL, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: BalanceResponse = await response.json();
		return result;
	} catch (error) {
		console.error('Erreur lors de la récupération du solde:', error);
		throw error;
	}
}

/**
 * Obtenir les informations sur un service
 */
export async function getServiceInfo(serviceId: number = 46): Promise<ServiceInfo | null> {
	try {
		const formData = new FormData();
		formData.append('key', API_KEY);
		formData.append('action', 'services');

		const response = await fetch(API_BASE_URL, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const services: ServiceInfo[] = await response.json();
		return services.find(service => service.service === serviceId) || null;
	} catch (error) {
		console.error('Erreur lors de la récupération des services:', error);
		throw error;
	}
}

/**
 * Générer une quantité aléatoire entre 50 et 70
 */
export function generateRandomQuantity(): number {
	return Math.floor(Math.random() * (70 - 50 + 1)) + 50;
}
