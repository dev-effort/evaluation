import { createClient } from '@supabase/supabase-js';
import type { CommitSubmitRequest } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export async function submitCommit(
  data: CommitSubmitRequest,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const expectedApiKey = import.meta.env.VITE_API_KEY;

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return { success: false, error: 'Invalid API key' };
  }

  if (!serviceClient) {
    return { success: false, error: 'Service client not configured' };
  }

  try {
    let teamId: string | null = null;
    const { data: existingTeam } = await serviceClient
      .from('teams')
      .select('id')
      .eq('name', data.team_name)
      .single();

    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      const { data: newTeam, error: teamError } = await serviceClient
        .from('teams')
        .insert({ name: data.team_name })
        .select('id')
        .single();

      if (teamError) throw teamError;
      teamId = newTeam.id;
    }

    let developerId: string | null = null;
    const developerQuery = data.developer_email
      ? serviceClient.from('developers').select('id').eq('email', data.developer_email).single()
      : serviceClient.from('developers').select('id').eq('name', data.developer_name).eq('team_id', teamId).single();

    const { data: existingDeveloper } = await developerQuery;

    if (existingDeveloper) {
      developerId = existingDeveloper.id;
    } else {
      const { data: newDeveloper, error: devError } = await serviceClient
        .from('developers')
        .insert({
          name: data.developer_name,
          email: data.developer_email || null,
          team_id: teamId,
        })
        .select('id')
        .single();

      if (devError) throw devError;
      developerId = newDeveloper.id;
    }

    const { error: commitError } = await serviceClient.from('commits').insert({
      commit_id: data.commit_id,
      message: data.message,
      developer_id: developerId,
      evaluation_total: data.evaluation.total,
      evaluation_complexity: data.evaluation.complexity,
      evaluation_volume: data.evaluation.volume,
      evaluation_thinking: data.evaluation.thinking,
      evaluation_others: data.evaluation.others,
      comment: data.comment || null,
      work_hours: data.work_hours || null,
      ai_driven_minutes: data.ai_driven_minutes || null,
      productivity: data.productivity || null,
    });

    if (commitError) throw commitError;

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
