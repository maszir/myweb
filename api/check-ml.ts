import { getSecrets } from '../_lib/secrets';

export default async function handler(req: any, res: any) {
  const { uid, zone } = req.query;
  const secrets = await getSecrets();
  const apiKey = secrets.apiKey || 'planaai';
  
  try {
    const response = await fetch(`https://www.sankavollerei.com/game/cekdmml?apikey=${apiKey}&uid=${uid}&zone=${zone}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check ID' });
  }
}
