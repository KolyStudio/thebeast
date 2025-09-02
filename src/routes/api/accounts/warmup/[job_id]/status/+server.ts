import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Types pour le statut du job
interface WarmupJobStatus {
	job_id: string;
	status: 'running' | 'completed' | 'cancelled' | 'error';
	start_time?: string;
	end_time?: string;
	current_batch: number;
	total_batches: number;
	accounts_processed: number;
	total_accounts: number;
	progress_percentage: number;
	results: any[];
	error?: string;
}

// Stockage temporaire des jobs (en production, utilisez une vraie base de données)
const activeJobs = new Map<string, WarmupJobStatus>();

export const GET: RequestHandler = async ({ params }) => {
	try {
		const jobId = params.job_id;

		if (!jobId) {
			return json(
				{
					error: 'Paramètre manquant',
					message: 'Job ID requis'
				},
				{ status: 400 }
			);
		}

		// Vérifier si le job existe
		const jobStatus = activeJobs.get(jobId);

		if (!jobStatus) {
			// Simuler un job pour les tests
			const mockJobStatus: WarmupJobStatus = {
				job_id: jobId,
				status: 'completed',
				start_time: new Date(Date.now() - 600000).toISOString(), // Il y a 10 minutes
				end_time: new Date().toISOString(),
				current_batch: 1,
				total_batches: 1,
				accounts_processed: 3,
				total_accounts: 3,
				progress_percentage: 100,
				results: [
					{
						batch_number: 1,
						accounts_processed: [
							{
								account_id: 1,
								username: 'compte1',
								status: 'success',
								stats: {
									likes: 45,
									comments: 8,
									follows: 2,
									duration_minutes: 12.5
								},
								duration_minutes: 12.5
							}
						],
						batch_duration_minutes: 15.2,
						success_count: 3,
						error_count: 0,
						banned_count: 0
					}
				]
			};

			return json(mockJobStatus);
		}

		return json(jobStatus);
	} catch (error) {
		console.error('Erreur lors de la récupération du statut du job:', error);
		
		return json(
			{
				error: 'Erreur interne du serveur',
				message: 'Une erreur est survenue lors de la récupération du statut'
			},
			{ status: 500 }
		);
	}
};
