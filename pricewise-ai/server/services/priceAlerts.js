import { supabase, isSupabaseReady } from './supabase.js';

export async function createAlert({ email, productQuery, productName, targetPrice, currentPrice }) {
  if (!isSupabaseReady()) return { error: 'Database not configured' };

  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        email,
        product_query: productQuery,
        product_name: productName || productQuery,
        target_price: targetPrice,
        current_price: currentPrice || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { alert: data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function getAlerts(email) {
  if (!isSupabaseReady()) return [];

  try {
    let query = supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (email) query = query.eq('email', email);

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function deleteAlert(id) {
  if (!isSupabaseReady()) return { error: 'Database not configured' };

  try {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function getActiveAlerts() {
  if (!isSupabaseReady()) return [];

  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('status', 'active');

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function markAlertTriggered(id, currentPrice) {
  if (!isSupabaseReady()) return;

  try {
    await supabase
      .from('price_alerts')
      .update({
        status: 'triggered',
        current_price: currentPrice,
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } catch {
    // silent
  }
}
