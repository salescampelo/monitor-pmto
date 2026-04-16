import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const ALLOWED_FILES = new Set([
  'mention_history.json',
  'social_metrics.json',
  'social_sentiment.json',
  'geo_electoral.json',
  'campaign_kpis.json',
  'adversarios.json',
  'tendencia_voto_2022.json',
  'liderancas.json',
]);

export default async function handler(req, res) {
  // 1. Validate auth token
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = auth.slice(7);
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // 2. Validate filename — prevent path traversal
  const { file } = req.query;
  if (!file || !ALLOWED_FILES.has(file)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // 3. Read from bundled public/data/ (included via vercel.json includeFiles)
  try {
    const content = readFileSync(join(process.cwd(), 'public', 'data', file), 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).send(content);
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
}
