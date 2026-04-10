/**
 * POST /api/trigger
 * Dispara o workflow "PMTO Monitor" no GitHub Actions (job: noticias).
 *
 * Headers obrigatórios:
 *   x-trigger-secret: <TRIGGER_SECRET>
 *
 * Env vars necessárias no Vercel:
 *   GH_TOKEN       — PAT com escopo "workflow"
 *   TRIGGER_SECRET — string aleatória para autenticação
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const secret = req.headers.get('x-trigger-secret');
  if (!secret || secret !== process.env.TRIGGER_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ghToken = process.env.GH_TOKEN;
  if (!ghToken) {
    return Response.json({ error: 'GH_TOKEN não configurado' }, { status: 500 });
  }

  const resp = await fetch(
    'https://api.github.com/repos/salescampelo/scraper-pmto/actions/workflows/monitor.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { job: 'noticias' } }),
    }
  );

  // GitHub retorna 204 No Content em caso de sucesso
  if (resp.status === 204) {
    return Response.json({
      ok: true,
      message: 'Varredura iniciada. Dados disponíveis em ~2 min.',
    });
  }

  const text = await resp.text();
  return Response.json(
    { error: `GitHub API: ${resp.status}`, detail: text },
    { status: 502 }
  );
}
