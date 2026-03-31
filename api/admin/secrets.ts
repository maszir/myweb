import { getSecrets, saveSecrets } from '../_lib/secrets';

export default async function handler(req: any, res: any) {
  const pin = req.headers['x-admin-pin'];
  const secrets = await getSecrets();
  
  if (secrets.adminPin && secrets.adminPin !== pin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    res.json(secrets);
  } else if (req.method === 'POST') {
    const newSecrets = { ...secrets, ...req.body };
    await saveSecrets(newSecrets);
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
