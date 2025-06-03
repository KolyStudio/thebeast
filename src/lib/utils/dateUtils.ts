/**
 * Utilitaires pour le formatage des dates avec dayjs
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

// Configuration de dayjs avec le plugin relativeTime et la locale française
dayjs.extend(relativeTime);
dayjs.locale('fr');

/**
 * Formate une date en temps relatif en français
 * @param date - La date à formater (string, Date, ou dayjs)
 * @returns Le temps relatif formaté en français
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Jamais';
  }

  try {
    const targetDate = dayjs(date);
    const now = dayjs();

    // Vérifier si la date est valide
    if (!targetDate.isValid()) {
      return 'Date invalide';
    }

    // Utiliser dayjs pour les comparaisons de jours calendaires
    if (targetDate.isSame(now, 'day')) {
      return 'Aujourd\'hui';
    } else if (targetDate.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Hier';
    } else if (targetDate.isSame(now.subtract(2, 'day'), 'day')) {
      return '2 jours';
    } else {
      // Utiliser la fonction fromNow de dayjs pour le reste
      return targetDate.fromNow();
    }
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Formate une date en format court français (ex: "12 jan. 2024")
 * @param date - La date à formater
 * @returns La date formatée en français
 */
export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Aucune date';
  }

  try {
    const targetDate = dayjs(date);
    if (!targetDate.isValid()) {
      return 'Date invalide';
    }

    return targetDate.format('DD MMM YYYY');
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Formate une date en format complet français (ex: "12 janvier 2024 à 14:30")
 * @param date - La date à formater
 * @returns La date formatée en français
 */
export function formatFullDate(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Aucune date';
  }

  try {
    const targetDate = dayjs(date);
    if (!targetDate.isValid()) {
      return 'Date invalide';
    }

    return targetDate.format('DD MMMM YYYY à HH:mm');
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date - La date à vérifier
 * @returns true si la date est aujourd'hui
 */
export function isToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const targetDate = dayjs(date);
    return targetDate.isSame(dayjs(), 'day');
  } catch (error) {
    return false;
  }
}

/**
 * Vérifie si une date est hier
 * @param date - La date à vérifier
 * @returns true si la date est hier
 */
export function isYesterday(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const targetDate = dayjs(date);
    return targetDate.isSame(dayjs().subtract(1, 'day'), 'day');
  } catch (error) {
    return false;
  }
}

/**
 * Obtient le temps écoulé depuis une date en millisecondes
 * @param date - La date de référence
 * @returns Le temps écoulé en millisecondes
 */
export function getTimeElapsed(date: string | Date | null | undefined): number {
  if (!date) return 0;

  try {
    const targetDate = dayjs(date);
    return dayjs().diff(targetDate);
  } catch (error) {
    return 0;
  }
}
