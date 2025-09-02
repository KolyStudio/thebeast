import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Types pour la requête de warmup
interface WarmupAccount {
	id: number;
	username: string;
}

interface WarmupRequest {
	accounts: WarmupAccount[];
	batch_size?: number;
}

interface WarmupResponse {
	job_id: string;
	total_accounts: number;
	total_batches: number;
	estimated_duration_minutes: number;
	batch_size: number;
	status: string;
}



export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: WarmupRequest = await request.json();

		// Validation des paramètres
		if (!body.accounts || !Array.isArray(body.accounts) || body.accounts.length === 0) {
			return json(
				{
					error: 'Paramètres invalides',
					message: 'Aucun compte spécifié pour le warmup'
				},
				{ status: 400 }
			);
		}

		// Validation de chaque compte
		for (const account of body.accounts) {
			if (!account.id || !account.username) {
				return json(
					{
						error: 'Paramètres invalides',
						message: 'Chaque compte doit avoir un id et un username'
					},
					{ status: 400 }
				);
			}
		}

		// Appel réel au backend de warmup
		try {
			const backendResponse = await fetch('http://localhost:7001/api/accounts/warmup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					accounts: body.accounts,
					batch_size: body.batch_size || 10
				})
			});

			// Vérifier si la réponse du backend est OK
			if (!backendResponse.ok) {
				const errorData = await backendResponse.json().catch(() => ({}));
				return json(
					{
						error: 'Erreur du backend de warmup',
						message: errorData.message || `Erreur HTTP ${backendResponse.status}`
					},
					{ status: backendResponse.status }
				);
			}

			// Retourner directement la réponse du backend
			const backendResult = await backendResponse.json();
			return json(backendResult);

		} catch (fetchError) {
			// Erreur de connexion au backend
			console.error('Erreur de connexion au backend de warmup:', fetchError);
			return json(
				{
					error: 'Connexion impossible',
					message: 'Impossible de se connecter au service de warmup. Vérifiez que le backend est démarré sur le port 7001.'
				},
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error('Erreur lors du démarrage du warmup:', error);
		
		return json(
			{
				error: 'Erreur interne du serveur',
				message: 'Une erreur est survenue lors du démarrage du warmup'
			},
			{ status: 500 }
		);
	}
};
