import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const { username } = req.query;
  const secrets = await getSecrets();
  const apiKey = secrets.apiKey || 'planaai';
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const response = await fetch(`https://www.sankavollerei.com/stalk/tiktok?apikey=${apiKey}&username=${username}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error stalking TikTok:', error);
    res.status(500).json({ error: 'Failed to stalk TikTok' });
  }
}
