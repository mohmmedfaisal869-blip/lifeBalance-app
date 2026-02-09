// Supabase configuration for LifeBalance app
const SUPABASE_URL = 'https://hagdmdogxwuueooczqji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aS384Eu8SSr5ij21ykCkMA_nMtbOR8A';

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  is_guest: boolean;
  water_intake: number;
  water_goal: number;
  quran_pages_today: number;
  quran_daily_goal: number;
  quran_total_pages: number;
  quran_streak: number;
  tasks_completed: number;
  gratitude_count: number;
  full_prefs?: any;
  sleep_data?: any;
  tasks_data?: any;
  gratitude_data?: any;
  habits_data?: any;
  created_at?: string;
  updated_at?: string;
}

// Simple fetch wrapper for Supabase REST API
async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Supabase error:', errorText);
    throw new Error(`Supabase error: ${response.status}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Upsert (insert or update) user data
export async function syncUserToSupabase(userData: Partial<UserData>): Promise<void> {
  if (!userData.id) return;
  
  try {
    // Check if user exists
    const existing = await supabaseRequest(`users?id=eq.${encodeURIComponent(userData.id)}&select=id`);
    
    if (existing && existing.length > 0) {
      // Update existing user
      await supabaseRequest(`users?id=eq.${encodeURIComponent(userData.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...userData,
          updated_at: new Date().toISOString(),
        }),
      });
    } else {
      // Insert new user
      await supabaseRequest('users', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    }
    console.log('User synced to Supabase:', userData.id);
  } catch (error) {
    console.error('Failed to sync user to Supabase:', error);
  }
}

// Get all users (for host page)
export async function getAllUsersFromSupabase(): Promise<UserData[]> {
  try {
    const users = await supabaseRequest('users?select=*&order=updated_at.desc');
    return users || [];
  } catch (error) {
    console.error('Failed to fetch users from Supabase:', error);
    return [];
  }
}

// Save a suggestion to Supabase
export async function saveSuggestionToSupabase(suggestion: {
  user_email: string | null;
  user_name: string | null;
  text: string;
}): Promise<void> {
  try {
    await supabaseRequest('suggestions', {
      method: 'POST',
      body: JSON.stringify({
        ...suggestion,
        created_at: new Date().toISOString(),
      }),
    });
    console.log('Suggestion saved to Supabase');
  } catch (error) {
    console.error('Failed to save suggestion to Supabase:', error);
  }
}

// Get all suggestions (for host page)
export async function getAllSuggestionsFromSupabase(): Promise<any[]> {
  try {
    const suggestions = await supabaseRequest('suggestions?select=*&order=created_at.desc');
    return suggestions || [];
  } catch (error) {
    console.error('Failed to fetch suggestions from Supabase:', error);
    return [];
  }
}

// Export config for host page
export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
};
