import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement pour Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ncdhbospnqaadrtmzvcs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZGhib3NwbnFhYWRydG16dmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc2ODI3OTUsImV4cCI6MjA0MzI1ODc5NX0.HmyLRoz39tCaqF4ORwnE2PhI1Dw3GcO8-vB3bWzcxT0';

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey); 
