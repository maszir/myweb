import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const { resi, kurir } = req.query;
  const secrets = await getSecrets();
  const apiKey = secrets.apiKey || 'planaai';
  
  if (!resi || !kurir) {
    return res.status(400).json({ error: 'Resi and Kurir are required' });
  }

  try {
    const response = await fetch(`https://www.sankavollerei.com/stalk/cek-resi?apikey=${apiKey}&resi=${resi}&kurir=${kurir}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error checking resi:', error);
    res.status(500).json({ error: 'Failed to check resi' });
  }
}
