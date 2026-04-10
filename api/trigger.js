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
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = req.headers['x-trigger-secret'];
  if (!secret || secret !== process.env.TRIGGER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ghToken = process.env.GH_TOKEN;
  if (!ghToken) {
    return res.status(500).json({ error: 'GH_TOKEN não configurado' });
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
    return res.status(200).json({
      ok: true,
      message: 'Varredura iniciada. Dados disponíveis em ~2 min.',
    });
  }

  const text = await resp.text();
  return res.status(502).json({ error: `GitHub API: ${resp.status}`, detail: text });
}
