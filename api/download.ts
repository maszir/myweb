import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const { type, url } = req.query;
  const secrets = await getSecrets();
  const apiKey = secrets.apiKey || 'planaai';
  
  if (!type || !url) {
    return res.status(400).json({ error: 'Type and URL are required' });
  }

  try {
    const response = await fetch(`https://www.sankavollerei.com/download/${type}?apikey=${apiKey}&url=${encodeURIComponent(url as string)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Error downloading ${type}:`, error);
    res.status(500).json({ error: `Failed to download ${type}` });
  }
}
