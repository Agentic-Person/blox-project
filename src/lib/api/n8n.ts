// n8n workflow integration helpers
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export interface N8nWebhookPayload {
  event: string
  data: Record<string, any>
  timestamp: string
}

export async function triggerN8nWorkflow(
  workflowId: string,
  payload: Record<string, any>
): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.log('[Mock n8n] Triggering workflow:', workflowId, payload)
    return true
  }

  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/${workflowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error triggering n8n workflow:', error)
    return false
  }
}

// Specific workflow triggers
export async function createDiscordChannel(teamId: string, teamName: string) {
  return triggerN8nWorkflow('discord-channel-creation', {
    teamId,
    teamName,
    event: 'team.created',
  })
}

export async function checkContentHealth() {
  return triggerN8nWorkflow('content-health-check', {
    event: 'content.health_check',
  })
}

export async function sendProgressReport(userId: string, progress: any) {
  return triggerN8nWorkflow('progress-report', {
    userId,
    progress,
    event: 'user.progress_update',
  })
}