import { supabase } from './supabase.js';

/**
 * Registra uma ação do usuário autenticado na tabela access_logs.
 * Falha silenciosamente — nunca deve interromper o fluxo do app.
 *
 * @param {'login'|'panel_view'|'data_fetch'} action
 * @param {string} [detail] - painel, arquivo, etc.
 */
export const logAccess = async (action, detail = null) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from('access_logs').insert({
      user_id:    session.user.id,
      user_email: session.user.email,
      action,
      detail,
    });
  } catch {
    // Silencioso — falha no log não deve afetar o usuário
  }
};
