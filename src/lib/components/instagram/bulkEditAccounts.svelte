<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Edit, Loader2, AlertCircle, CheckCircle, Info } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import TerminalComponent from '$lib/components/ui/terminal.svelte';
	import { type InstagramAccount } from '$lib/api/instagramAccounts.svelte';

	interface Props {
		open: boolean;
		selectedAccounts: InstagramAccount[];
		onClose: () => void;
		onOperationStart?: () => void;
		onOperationEnd?: () => void;
	}

	let {
		open = $bindable(),
		selectedAccounts,
		onClose,
		onOperationStart,
		onOperationEnd
	}: Props = $props();

	// États de l'interface
	let isLoading = $state(false);
	let showConfirmation = $state(false);
	let operationResult = $state<{
		success: boolean;
		message: string;
		details?: string;
	} | null>(null);

	// États du terminal
	let terminalOpen = $state(false);
	let terminalComponent: TerminalComponent;
	let operationCancelled = $state(false);

	// États de l'API
	let currentJobId = $state<string | null>(null);
	let apiBaseUrl = 'http://localhost:7001'; // API principale Instagram

	// Charger le job ID depuis le localStorage au démarrage
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedJobId = localStorage.getItem('instagram_current_job_id');
			if (savedJobId) {
				currentJobId = savedJobId;
			}
		}
	});

	// Sauvegarder le job ID dans le localStorage quand il change
	$effect(() => {
		if (typeof window !== 'undefined') {
			if (currentJobId) {
				localStorage.setItem('instagram_current_job_id', currentJobId);
			} else {
				localStorage.removeItem('instagram_current_job_id');
			}
		}
	});

	// Exposer les fonctions pour le contrôle externe
	export function openTerminal() {
		terminalOpen = true;
		// Attendre que le composant soit initialisé puis charger les logs frais
		setTimeout(() => {
			if (terminalComponent) {
				terminalComponent.clearLogs();
				loadRecentLogs();
			}
		}, 100);
	}

	// Fonction pour rafraîchir les logs
	function refreshLogs() {
		if (terminalComponent) {
			terminalComponent.clearLogs();
			loadRecentLogs();
		}
	}

	export async function stopOperation() {
		operationCancelled = true;
		if (terminalComponent) {
			terminalComponent.addLog('warning', 'Cancelling operation...');
		}

		// Arrêter le polling des logs
		if (logPollingInterval) {
			stopLogPolling();
		}

		// Annuler tous les jobs via l'API
		try {
			const response = await fetch(`${apiBaseUrl}/api/jobs/cancel-all`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const result = await response.json();
				if (terminalComponent) {
					terminalComponent.addLog('info', result.message || 'All jobs cancelled successfully');
				}
			} else {
				if (terminalComponent) {
					terminalComponent.addLog('error', 'Failed to cancel jobs via API');
				}
			}
		} catch (error) {
			if (terminalComponent) {
				terminalComponent.addLog(
					'error',
					`Error cancelling jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		// Arrêter le polling des logs
		if (logPollingInterval) {
			stopLogPolling();
		}
	}

	// État des champs à modifier
	let fieldsToEdit = $state({
		username: false,
		bio: false,
		photo: false,
		firstname: false,
		url: false,
		statut: false,
		account_type: false
	});

	// Données du formulaire pour les champs sélectionnés
	let formData = $state({
		username: '',
		bio: '',
		photo: '',
		firstname: '',
		url: '',
		statut: '',
		account_type: ''
	});

	// État pour les fichiers photos sélectionnés (multiple)
	let selectedPhotoFiles = $state<File[]>([]);
	let photoPreviewUrls = $state<string[]>([]);

	// Types pour la validation et les erreurs
	interface ValidationError {
		field: string;
		message: string;
	}

	// État des erreurs de validation
	let validationErrors = $state<ValidationError[]>([]);

	// Réinitialiser le formulaire quand le dialog se ferme
	let previousOpen = $state(open);
	$effect(() => {
		if (previousOpen && !open) {
			resetForm();
		}
		previousOpen = open;
	});

	function resetForm() {
		fieldsToEdit = {
			username: false,
			bio: false,
			photo: false,
			firstname: false,
			url: false,
			statut: false,
			account_type: false
		};
		formData = {
			username: '',
			bio: 'Infirmière 👩🏻‍⚕️💉\nViens découvrir mon profil secret 🌶👇🏻',
			photo: '',
			firstname: 'Pauline 💕',
			url: 'https://my-secret.net/pauline',
			statut: 'private',
			account_type: 'personal'
		};
		validationErrors = [];
		operationResult = null;
		showConfirmation = false;
		isLoading = false;
		operationCancelled = false;

		// Réinitialiser les états de l'API
		currentJobId = null;

		// Arrêter le polling des logs seulement s'il est actif
		if (logPollingInterval) {
			stopLogPolling();
		}

		// Réinitialiser les états photo
		selectedPhotoFiles = [];
		photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
		photoPreviewUrls = [];
	}

	// Fonctions du terminal
	function closeTerminal() {
		terminalOpen = false;
	}

	// Fonctions pour la gestion des fichiers photo (multiple)
	function handlePhotoFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (files && files.length > 0) {
			const newFiles: File[] = [];
			const newUrls: string[] = [];

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Vérifier que c'est bien une image
				if (!file.type.startsWith('image/')) {
					operationResult = {
						success: false,
						message: `Le fichier "${file.name}" n'est pas une image valide`
					};
					return;
				}

				// Vérifier la taille du fichier (max 5MB)
				if (file.size > 5 * 1024 * 1024) {
					operationResult = {
						success: false,
						message: `Le fichier "${file.name}" ne doit pas dépasser 5MB`
					};
					return;
				}

				newFiles.push(file);
				newUrls.push(URL.createObjectURL(file));
			}

			// Nettoyer les anciennes URLs
			photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));

			// Mettre à jour les états
			selectedPhotoFiles = newFiles;
			photoPreviewUrls = newUrls;

			// Mettre à jour formData pour l'affichage
			formData = {
				...formData,
				photo: `${newFiles.length} fichier(s) sélectionné(s)`
			};
		}
	}

	function removeSelectedPhotos() {
		photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
		selectedPhotoFiles = [];
		photoPreviewUrls = [];
		formData = {
			...formData,
			photo: ''
		};
	}

	function removePhotoAtIndex(index: number) {
		if (index >= 0 && index < selectedPhotoFiles.length) {
			// Nettoyer l'URL de prévisualisation
			URL.revokeObjectURL(photoPreviewUrls[index]);

			// Supprimer le fichier et l'URL à l'index donné
			selectedPhotoFiles = selectedPhotoFiles.filter((_, i) => i !== index);
			photoPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);

			// Mettre à jour formData
			formData = {
				...formData,
				photo:
					selectedPhotoFiles.length > 0
						? `${selectedPhotoFiles.length} fichier(s) sélectionné(s)`
						: ''
			};
		}
	}

	// Fonctions pour les logs via polling Supabase
	let logPollingInterval: ReturnType<typeof setInterval> | null = null;
	let lastTimestamp: string | null = null;

	function connectToLogs(jobId: string) {
		// Démarrer le polling des logs directement depuis Supabase
		startLogPolling(jobId);
	}

	// Fonction pour charger les logs récents de la base de données (sans filtrer par job_id)
	async function loadRecentLogs() {
		try {
			// Importer le client Supabase existant
			const { supabase } = await import('$lib/supabaseClient');

			// Récupérer les logs récents (dernières 24 heures) sans filtrer par job_id
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

			const { data: logs, error } = await supabase
				.from('instagram_logs')
				.select('*')
				.in('level', ['INFO', 'WARNING', 'ERROR', 'SUCCESS'])
				.gte('timestamp', twentyFourHoursAgo)
				.order('timestamp', { ascending: true })
				.limit(100); // Limiter à 100 logs pour éviter la surcharge

			if (error) {
				console.error('Erreur lors du chargement des logs récents:', error);
				return;
			}

			// Vider le terminal et charger tous les logs frais depuis Supabase
			if (terminalComponent) {
				// Toujours effacer les logs existants dans le terminal
				terminalComponent.clearLogs();

				if (logs && logs.length > 0) {
					logs.forEach((log: any) => {
						// Mapper le niveau de log
						let logLevel: 'info' | 'warning' | 'error' | 'success' = 'info';
						const level = log.level?.toLowerCase() || 'info';

						if (level === 'error' || level === 'critical') {
							logLevel = 'error';
						} else if (level === 'warning') {
							logLevel = 'warning';
						} else if (
							level === 'success' ||
							log.message.includes('completed successfully') ||
							log.message.includes('successfully') ||
							log.message.includes('completed')
						) {
							logLevel = 'success';
						}

						// Construire le message d'affichage
						let displayMessage = log.message;

						// Ajouter le job_id si disponible (8 premiers caractères)
						if (log.job_id) {
							displayMessage = `[${log.job_id.substring(0, 8)}] ${displayMessage}`;
						}

						// Ajouter le nom du compte si disponible
						if (log.account_username) {
							displayMessage = `[${log.account_username}] ${displayMessage}`;
						}

						// Ajouter le type de tâche si disponible
						if (log.task_type) {
							displayMessage = `${displayMessage} (${log.task_type})`;
						}

						// Filtrer les messages de statut de haut niveau et les logs internes du composant
						const shouldSkipLog =
							log.message.includes('Progress: ') ||
							log.message.includes('Status: pending') ||
							log.message.includes('Connecting to operation logs') ||
							log.message.includes('Connected to operation logs') ||
							log.message.includes('Background processing starting') ||
							log.message.includes('Background processing completed') ||
							log.logger_name?.includes('connection_manager') ||
							log.message.includes('Starting bulk edit') ||
							log.message.includes('Sending') ||
							log.message.includes('Job started successfully');

						if (!shouldSkipLog) {
							terminalComponent.addLog(logLevel, displayMessage);
						}
					});

					// Ne pas mettre à jour lastTimestamp car on veut toujours recharger depuis Supabase
				} else {
					// Afficher un message si aucun log récent
					terminalComponent.addLog('info', 'Aucun log récent trouvé dans les dernières 24 heures');
				}
			}
		} catch (error) {
			console.error('Erreur lors du chargement des logs récents:', error);
			if (terminalComponent) {
				terminalComponent.addLog('error', 'Erreur lors du chargement des logs récents');
			}
		}
	}

	// Fonction pour charger les logs existants (pour quand on revient sur la page)
	async function loadExistingLogs(jobId: string) {
		try {
			// Importer le client Supabase existant
			const { supabase } = await import('$lib/supabaseClient');

			// Récupérer tous les logs pour ce job (pas seulement les récents)
			const { data: logs, error } = await supabase
				.from('instagram_logs')
				.select('*')
				.eq('job_id', jobId)
				.in('level', ['INFO', 'WARNING', 'ERROR', 'SUCCESS'])
				.order('timestamp', { ascending: true });

			if (error) {
				console.error('Erreur lors du chargement des logs existants:', error);
				return;
			}

			// Vider le terminal et charger tous les logs
			if (terminalComponent && logs && logs.length > 0) {
				// Effacer les logs existants dans le terminal
				terminalComponent.clearLogs();

				logs.forEach((log: any) => {
					// Mapper le niveau de log
					let logLevel: 'info' | 'warning' | 'error' | 'success' = 'info';
					const level = log.level?.toLowerCase() || 'info';

					if (level === 'error' || level === 'critical') {
						logLevel = 'error';
					} else if (level === 'warning') {
						logLevel = 'warning';
					} else if (
						level === 'success' ||
						log.message.includes('completed successfully') ||
						log.message.includes('successfully') ||
						log.message.includes('completed')
					) {
						logLevel = 'success';
					}

					// Construire le message d'affichage
					let displayMessage = log.message;

					// Ajouter le nom du compte si disponible
					if (log.account_username) {
						displayMessage = `[${log.account_username}] ${displayMessage}`;
					}

					// Ajouter le type de tâche si disponible
					if (log.task_type) {
						displayMessage = `${displayMessage} (${log.task_type})`;
					}

					// Filtrer les messages de statut de haut niveau et les logs internes du composant
					const shouldSkipLog =
						log.message.includes('Progress: ') ||
						log.message.includes('Status: pending') ||
						log.message.includes('Connecting to operation logs') ||
						log.message.includes('Connected to operation logs') ||
						log.message.includes('Background processing starting') ||
						log.message.includes('Background processing completed') ||
						log.logger_name?.includes('connection_manager') ||
						log.message.includes('Starting bulk edit') ||
						log.message.includes('Sending') ||
						log.message.includes('Job started successfully');

					if (!shouldSkipLog) {
						terminalComponent.addLog(logLevel, displayMessage);
					}
				});

				// Mettre à jour le dernier timestamp pour éviter les doublons
				lastTimestamp = logs[logs.length - 1].timestamp;
			}
		} catch (error) {
			console.error('Erreur lors du chargement des logs existants:', error);
		}
	}

	function startLogPolling(jobId: string) {
		// Arrêter le polling précédent s'il existe
		if (logPollingInterval) {
			clearInterval(logPollingInterval);
		}

		// Réinitialiser le timestamp
		lastTimestamp = null;

		const pollLogs = async () => {
			try {
				// Importer le client Supabase existant
				const { supabase } = await import('$lib/supabaseClient');

				// Construire la requête Supabase
				let query = supabase
					.from('instagram_logs')
					.select('*')
					.eq('job_id', jobId)
					.in('level', ['INFO', 'WARNING', 'ERROR', 'SUCCESS'])
					.order('timestamp', { ascending: true });

				// Filtrer par timestamp si on en a un
				if (lastTimestamp) {
					query = query.gt('timestamp', lastTimestamp);
				} else {
					// Récupérer seulement les logs des 2 dernières minutes
					const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
					query = query.gte('timestamp', twoMinutesAgo);
				}

				const { data: logs, error } = await query;

				if (error) {
					console.error('Erreur Supabase:', error);
					return;
				}

				// Traiter les nouveaux logs
				if (
					logs &&
					logs.length > 0 &&
					terminalComponent &&
					typeof terminalComponent.addLog === 'function'
				) {
					logs.forEach((log: any) => {
						// Mapper le niveau de log
						let logLevel: 'info' | 'warning' | 'error' | 'success' = 'info';
						const level = log.level?.toLowerCase() || 'info';

						if (level === 'error' || level === 'critical') {
							logLevel = 'error';
						} else if (level === 'warning') {
							logLevel = 'warning';
						} else if (
							level === 'success' ||
							log.message.includes('completed successfully') ||
							log.message.includes('successfully') ||
							log.message.includes('completed')
						) {
							logLevel = 'success';
						}

						// Construire le message d'affichage
						let displayMessage = log.message;

						// Ajouter le nom du compte si disponible
						if (log.account_username) {
							displayMessage = `[${log.account_username}] ${displayMessage}`;
						}

						// Ajouter le type de tâche si disponible
						if (log.task_type) {
							displayMessage = `${displayMessage} (${log.task_type})`;
						}

						// Filtrer les messages de statut de haut niveau et les logs internes du composant
						const shouldSkipLog =
							log.message.includes('Progress: ') ||
							log.message.includes('Status: pending') ||
							log.message.includes('Connecting to operation logs') ||
							log.message.includes('Connected to operation logs') ||
							log.message.includes('Background processing starting') ||
							log.message.includes('Background processing completed') ||
							log.logger_name?.includes('connection_manager') ||
							log.message.includes('Starting bulk edit') ||
							log.message.includes('Sending') ||
							log.message.includes('Job started successfully');

						if (!shouldSkipLog) {
							terminalComponent.addLog(logLevel, displayMessage);
						}
					});

					// Mettre à jour le dernier timestamp
					lastTimestamp = logs[logs.length - 1].timestamp;
				}
			} catch (error) {
				console.error('Erreur lors de la récupération des logs:', error);
			}
		};

		// Démarrer le polling toutes les 2 secondes
		logPollingInterval = setInterval(pollLogs, 2000);

		// Exécuter immédiatement
		pollLogs();
	}

	function stopLogPolling() {
		if (logPollingInterval) {
			clearInterval(logPollingInterval);
			logPollingInterval = null;
		}
		lastTimestamp = null;
	}

	function validateForm(): ValidationError[] {
		const errors: ValidationError[] = [];

		// Validation du nom d'utilisateur
		if (fieldsToEdit.username) {
			if (!formData.username.trim()) {
				errors.push({ field: 'username', message: 'Au moins un pseudo est requis' });
			} else {
				const usernames = formData.username.split('\n').filter((line) => line.trim());
				if (usernames.length === 0) {
					errors.push({ field: 'username', message: 'Au moins un pseudo est requis' });
				} else if (usernames.length < selectedAccounts.length) {
					errors.push({
						field: 'username',
						message: `Vous devez fournir au moins ${selectedAccounts.length} pseudo(s) pour ${selectedAccounts.length} compte(s) sélectionné(s). Actuellement: ${usernames.length} pseudo(s)`
					});
				}
			}
		}

		// Validation de l'URL
		if (fieldsToEdit.url && formData.url.trim()) {
			try {
				new URL(formData.url);
			} catch {
				errors.push({ field: 'url', message: "L'URL doit être valide (ex: https://example.com)" });
			}
		}

		// Validation de la photo (fichiers multiples)
		if (fieldsToEdit.photo) {
			if (selectedPhotoFiles.length === 0) {
				errors.push({ field: 'photo', message: 'Veuillez sélectionner au moins un fichier image' });
			} else if (selectedPhotoFiles.length < selectedAccounts.length) {
				errors.push({
					field: 'photo',
					message: `Vous devez fournir au moins ${selectedAccounts.length} photo(s) pour ${selectedAccounts.length} compte(s) sélectionné(s). Actuellement: ${selectedPhotoFiles.length} photo(s)`
				});
			}
		}

		// Validation du nom
		if (fieldsToEdit.firstname && !formData.firstname.trim()) {
			errors.push({ field: 'firstname', message: 'Le nom est requis' });
		}

		// Validation du statut
		if (fieldsToEdit.statut && !formData.statut) {
			errors.push({ field: 'statut', message: 'Veuillez sélectionner un statut' });
		}

		// Validation du type de compte
		if (fieldsToEdit.account_type && !formData.account_type) {
			errors.push({ field: 'account_type', message: 'Veuillez sélectionner un type de compte' });
		}

		return errors;
	}

	async function prepareBulkEditData() {
		const accounts = selectedAccounts.map((account) => ({
			id: account.id,
			username: account.username
		}));

		const tasks: any[] = [];

		// Définir l'ordre spécifique des tâches (change_type avant change_status)
		const fieldOrder = [
			'username',
			'bio',
			'photo',
			'firstname',
			'url',
			'account_type', // change_type AVANT change_status
			'statut' // change_status APRÈS change_type
		];

		// Mapper les champs vers les tâches de l'API dans l'ordre défini
		for (const field of fieldOrder) {
			if (fieldsToEdit[field as keyof typeof fieldsToEdit]) {
				let task: any = {
					enabled: true
				};

				switch (field) {
					case 'username':
						task.task_type = 'change_username';
						const usernames = formData.username
							.split('\n')
							.filter((line) => line.trim())
							.map((line) => line.trim());
						task.parameters = { usernames };
						break;

					case 'bio':
						task.task_type = 'change_bio';
						task.parameters = { bio: formData.bio };
						break;

					case 'photo':
						task.task_type = 'change_photo';
						if (selectedPhotoFiles.length > 0) {
							// Convertir tous les fichiers en buffers
							const photoBuffers = [];
							for (const file of selectedPhotoFiles) {
								const arrayBuffer = await file.arrayBuffer();
								const buffer = Array.from(new Uint8Array(arrayBuffer));
								photoBuffers.push({
									photo_buffer: buffer,
									photo_filename: file.name,
									photo_mimetype: file.type
								});
							}
							task.parameters = { photos: photoBuffers };
						}
						break;

					case 'firstname':
						task.task_type = 'change_name';
						task.parameters = { full_name: formData.firstname };
						break;

					case 'url':
						task.task_type = 'change_url';
						task.parameters = { url: formData.url };
						break;

					case 'account_type':
						task.task_type = 'change_type';
						task.parameters = { account_type: formData.account_type };
						break;

					case 'statut':
						task.task_type = 'change_status';
						task.parameters = { is_private: formData.statut === 'private' };
						break;
				}

				if (task.task_type) {
					tasks.push(task);
				}
			}
		}

		return {
			accounts,
			tasks
		};
	}

	function getChangeSummary(): string[] {
		const summary: string[] = [];

		Object.entries(fieldsToEdit).forEach(([field, isSelected]) => {
			if (isSelected) {
				const value = formData[field as keyof typeof formData];
				const fieldName = getFieldDisplayName(field);

				if (field === 'username') {
					const usernames = value
						.split('\n')
						.filter((line) => line.trim())
						.map((line) => line.trim());
					summary.push(
						`${fieldName}: ${usernames.length} pseudo(s) - ${usernames.slice(0, 3).join(', ')}${usernames.length > 3 ? '...' : ''}`
					);
				} else if (field === 'photo') {
					if (selectedPhotoFiles.length > 0) {
						const totalSize = selectedPhotoFiles.reduce((sum, file) => sum + file.size, 0);
						const fileNames = selectedPhotoFiles
							.slice(0, 3)
							.map((f) => f.name)
							.join(', ');
						summary.push(
							`${fieldName}: ${selectedPhotoFiles.length} fichier(s) - ${fileNames}${selectedPhotoFiles.length > 3 ? '...' : ''} (${(totalSize / 1024 / 1024).toFixed(2)} MB total)`
						);
					} else {
						summary.push(`${fieldName}: Aucun fichier sélectionné`);
					}
				} else {
					summary.push(`${fieldName}: "${value}"`);
				}
			}
		});

		return summary;
	}

	function getFieldDisplayName(field: string): string {
		const displayNames: Record<string, string> = {
			username: 'Pseudos',
			bio: 'Bio',
			photo: 'Photo',
			firstname: 'Nom',
			url: 'URL',
			statut: 'Statut',
			account_type: 'Type de compte'
		};
		return displayNames[field] || field;
	}

	async function handleSave() {
		// Vérifier qu'au moins un champ est sélectionné
		const hasSelectedFields = Object.values(fieldsToEdit).some(Boolean);
		if (!hasSelectedFields) {
			operationResult = {
				success: false,
				message: 'Veuillez sélectionner au moins un champ à modifier.'
			};
			return;
		}

		// Vérifier qu'il y a des comptes sélectionnés
		if (selectedAccounts.length === 0) {
			operationResult = {
				success: false,
				message: 'Aucun compte sélectionné pour la modification en masse.'
			};
			return;
		}

		// Valider le formulaire
		const errors = validateForm();
		if (errors.length > 0) {
			validationErrors = errors;
			return;
		}

		// Afficher la confirmation
		validationErrors = [];
		showConfirmation = true;
	}

	async function confirmBulkEdit() {
		isLoading = true;
		showConfirmation = false;
		operationCancelled = false;

		// Notifier le début de l'opération
		if (onOperationStart) {
			onOperationStart();
		}

		// Ouvrir automatiquement le terminal
		terminalOpen = true;

		try {
			const bulkEditData = await prepareBulkEditData();

			// Log des données qui seraient envoyées à l'API
			console.log('=== BULK EDIT API CALL DATA ===');
			console.log('Endpoint: POST /api/accounts/process');
			console.log('Accounts:', bulkEditData.accounts);
			console.log('Tasks:', bulkEditData.tasks);
			console.log('Changes Summary:', getChangeSummary());
			console.log('================================');

			// Appel réel à l'API
			const response = await fetch(`${apiBaseUrl}/api/accounts/process`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bulkEditData)
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			currentJobId = result.job_id;

			// Connecter aux logs en temps réel
			connectToLogs(result.job_id);
		} catch (error) {
			console.error('Erreur lors de la modification en masse:', error);

			if (terminalComponent) {
				terminalComponent.addLog('error', 'Bulk edit operation failed', {
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}

			operationResult = {
				success: false,
				message: 'Erreur lors de la modification en masse',
				details: error instanceof Error ? error.message : 'Erreur inconnue'
			};
		} finally {
			isLoading = false;
			// Notifier la fin de l'opération
			if (onOperationEnd) {
				onOperationEnd();
			}
		}
	}

	function cancelConfirmation() {
		showConfirmation = false;
	}

	function handleCancel() {
		onClose();
	}

	function capitalizeStatus(status: string) {
		if (!status) return 'Sélectionnez un statut';
		if (status === 'private') return 'Private';
		if (status === 'public') return 'Public';
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	}

	function capitalizeAccountType(accountType: string) {
		if (!accountType) return 'Sélectionnez un type';
		if (accountType === 'business') return 'Business';
		if (accountType === 'personnel') return 'Personnel';
		return accountType.charAt(0).toUpperCase() + accountType.slice(1).toLowerCase();
	}

	function toggleField(field: keyof typeof fieldsToEdit) {
		console.log(`Toggling field: ${field}, current state: ${fieldsToEdit[field]}`);

		// Créer un nouvel objet pour déclencher la réactivité
		fieldsToEdit = {
			...fieldsToEdit,
			[field]: !fieldsToEdit[field]
		};

		console.log(`Field ${field} is now: ${fieldsToEdit[field]}`);

		// Réinitialiser la valeur si le champ est désélectionné
		if (!fieldsToEdit[field]) {
			if (field === 'photo') {
				// Réinitialiser spécifiquement les fichiers photo
				removeSelectedPhotos();
			} else {
				formData = {
					...formData,
					[field]: ''
				};
			}
			console.log(`Cleared value for field: ${field}`);
		}
	}

	function updateFormData(field: keyof typeof formData, value: string) {
		formData = {
			...formData,
			[field]: value
		};
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
		<Dialog.Header class="flex-shrink-0 border-b border-gray-200 pb-4">
			<div class="flex justify-between items-start">
				<div class="flex space-x-3">
					<div
						class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
					>
						{#if isLoading}
							<Loader2 class="h-5 w-5 animate-spin" />
						{:else if operationResult?.success}
							<CheckCircle class="h-5 w-5 text-green-500" />
						{:else if operationResult && !operationResult.success}
							<AlertCircle class="h-5 w-5 text-red-500" />
						{:else}
							<Edit class="h-5 w-5" />
						{/if}
					</div>
					<div>
						<h1 class="font-medium">
							{#if showConfirmation}
								Confirmer la modification en masse
							{:else if operationResult}
								{operationResult.success ? 'Modification réussie' : 'Erreur de modification'}
							{:else}
								Modification en masse
							{/if}
						</h1>
						<h2 class="text-neutral-content text-sm">
							{#if showConfirmation}
								Vérifiez les modifications avant de les appliquer
							{:else if operationResult}
								{operationResult.message}
							{:else}
								Modifiez {selectedAccounts.length} compte(s) sélectionné(s) simultanément.
							{/if}
						</h2>
					</div>
				</div>
			</div>
		</Dialog.Header>

		<!-- Zone de contenu défilable -->
		<div class="flex-1 overflow-y-auto px-1 py-4 space-y-4 scrollbar-hidden">
			<!-- Messages d'erreur de validation -->
			{#if validationErrors.length > 0}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<div class="flex items-center gap-2 mb-2">
						<AlertCircle class="h-4 w-4 text-red-500" />
						<span class="text-sm font-medium text-red-800">Erreurs de validation</span>
					</div>
					<ul class="text-sm text-red-700 space-y-1">
						{#each validationErrors as error}
							<li>• {error.message}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Message de résultat -->
			{#if operationResult}
				<div
					class="p-3 rounded-lg border {operationResult.success
						? 'bg-green-50 border-green-200'
						: 'bg-red-50 border-red-200'}"
				>
					<div class="flex items-center gap-2 mb-1">
						{#if operationResult.success}
							<CheckCircle class="h-4 w-4 text-green-500" />
							<span class="text-sm font-medium text-green-800">{operationResult.message}</span>
						{:else}
							<AlertCircle class="h-4 w-4 text-red-500" />
							<span class="text-sm font-medium text-red-800">{operationResult.message}</span>
						{/if}
					</div>
					{#if operationResult.details}
						<p class="text-sm {operationResult.success ? 'text-green-700' : 'text-red-700'}">
							{operationResult.details}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Formulaire de modification (masqué pendant la confirmation) -->
			{#if !showConfirmation}
				<div class="space-y-4">
					<!-- Pseudo (Username) -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.username}
							onclick={() => toggleField('username')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Pseudos</Label>
							<Textarea
								placeholder="pseudo1
pseudo2
pseudo3"
								bind:value={formData.username}
								class="w-full min-h-[100px] max-h-[100px]"
								disabled={!fieldsToEdit.username}
							/>
							<p class="text-xs text-gray-500">
								Un pseudo par ligne. Sera distribué aux comptes sélectionnés dans l'ordre.
							</p>
							{#if fieldsToEdit.username}
								{@const usernames = formData.username.split('\n').filter((line) => line.trim())}
								<p
									class="text-xs {usernames.length >= selectedAccounts.length
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{usernames.length} pseudo(s) fourni(s) / {selectedAccounts.length} requis
								</p>
							{/if}
						</div>
					</div>

					<!-- Bio -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.bio}
							onclick={() => toggleField('bio')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Bio</Label>
							<Textarea
								placeholder="Nouvelle bio..."
								bind:value={formData.bio}
								class="w-full min-h-[80px]"
								disabled={!fieldsToEdit.bio}
							/>
						</div>
					</div>

					<!-- Photo -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.photo}
							onclick={() => toggleField('photo')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Photo</Label>
							<div class="space-y-2">
								<Input
									type="file"
									accept="image/*"
									multiple
									class="w-full"
									disabled={!fieldsToEdit.photo}
									onchange={handlePhotoFileSelect}
								/>
								{#if selectedPhotoFiles.length > 0}
									<div class="space-y-2">
										{#each selectedPhotoFiles as file, index}
											<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
												<img
													src={photoPreviewUrls[index]}
													alt="Aperçu {index + 1}"
													class="w-16 h-16 object-cover rounded-lg"
												/>
												<div class="flex-1">
													<p class="text-sm font-medium">{file.name}</p>
													<p class="text-xs text-gray-500">
														{(file.size / 1024 / 1024).toFixed(2)} MB
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onclick={() => removePhotoAtIndex(index)}
													disabled={!fieldsToEdit.photo}
												>
													Supprimer
												</Button>
											</div>
										{/each}
										<Button
											variant="outline"
											size="sm"
											onclick={removeSelectedPhotos}
											disabled={!fieldsToEdit.photo}
											class="w-full"
										>
											Supprimer toutes les photos
										</Button>
									</div>
								{/if}
							</div>
							<p class="text-xs text-gray-500">
								Formats acceptés: JPG, PNG, GIF. Taille max: 5MB par fichier
							</p>
							{#if fieldsToEdit.photo}
								<p
									class="text-xs {selectedPhotoFiles.length >= selectedAccounts.length
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{selectedPhotoFiles.length} photo(s) fournie(s) / {selectedAccounts.length} requise(s)
								</p>
							{/if}
						</div>
					</div>

					<!-- Nom (Firstname) -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.firstname}
							onclick={() => toggleField('firstname')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Nom</Label>
							<Input
								type="text"
								placeholder="Nouveau nom"
								bind:value={formData.firstname}
								class="w-full"
								disabled={!fieldsToEdit.firstname}
							/>
						</div>
					</div>

					<!-- URL -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.url}
							onclick={() => toggleField('url')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">URL</Label>
							<Input
								type="url"
								placeholder="https://nouvelle-url.com"
								bind:value={formData.url}
								class="w-full"
								disabled={!fieldsToEdit.url}
							/>
						</div>
					</div>

					<!-- Statut -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.statut}
							onclick={() => toggleField('statut')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Statut</Label>
							<Select.Root type="single" disabled={!fieldsToEdit.statut}>
								<Select.Trigger class="w-full">
									<span>{capitalizeStatus(formData.statut)}</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="private" onclick={() => updateFormData('statut', 'private')}
										>Private</Select.Item
									>
									<Select.Item value="public" onclick={() => updateFormData('statut', 'public')}
										>Public</Select.Item
									>
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<!-- Type de compte -->
					<div class="flex items-start space-x-3">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded mt-1"
							checked={fieldsToEdit.account_type}
							onclick={() => toggleField('account_type')}
						/>
						<div class="flex w-full flex-col gap-1.5">
							<Label class="text-sm font-medium">Type de compte</Label>
							<Select.Root type="single" disabled={!fieldsToEdit.account_type}>
								<Select.Trigger class="w-full">
									<span>{capitalizeAccountType(formData.account_type)}</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Item
										value="business"
										onclick={() => updateFormData('account_type', 'business')}>Business</Select.Item
									>
									<Select.Item
										value="personnel"
										onclick={() => updateFormData('account_type', 'personal')}
										>Personnel</Select.Item
									>
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</div>
			{/if}

			<!-- Section de confirmation -->
			{#if showConfirmation}
				<div class="bg-info/5 rounded-lg p-4">
					<div class="flex items-center gap-2 mb-3">
						<Info class="h-5 w-5 text-info" />
						<span class="font-medium text-info">Résumé des modifications</span>
					</div>
					<div class="space-y-2 text-sm text-info">
						<p><strong>Comptes concernés:</strong> {selectedAccounts.length}</p>
						<p><strong>Modifications à appliquer:</strong></p>
						<ul class="list-disc list-inside ml-4 space-y-1">
							{#each getChangeSummary() as change}
								<li>{change}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer fixe -->
		<Dialog.Footer class="flex-shrink-0 pt-4 mt-0">
			{#if showConfirmation}
				<Button variant="outline" onclick={cancelConfirmation} disabled={isLoading}>Retour</Button>
				<Button onclick={confirmBulkEdit} class="bg-white hover:bg-white" disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						Application en cours...
					{:else}
						Confirmer les modifications
					{/if}
				</Button>
			{:else if operationResult?.success}
				<Button onclick={handleCancel}>
					<CheckCircle class="w-4 h-4 mr-2" />
					Fermer
				</Button>
			{:else}
				<Button variant="outline" onclick={handleCancel} disabled={isLoading}>Annuler</Button>
				<Button onclick={handleSave} class="bg-white hover:bg-white" disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						Traitement...
					{:else}
						Appliquer les modifications
					{/if}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Composant Terminal -->
<TerminalComponent
	bind:this={terminalComponent}
	bind:open={terminalOpen}
	title="Gestion des changements Instagram"
	onClose={closeTerminal}
	onStop={stopOperation}
	onRefresh={refreshLogs}
	isOperationRunning={isLoading}
/>

<style>
	.scrollbar-hidden {
		/* Firefox */
		scrollbar-width: none;
	}

	/* Webkit browsers */
	.scrollbar-hidden::-webkit-scrollbar {
		display: none;
	}
</style>
