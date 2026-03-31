import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const { pin } = req.body;
  const secrets = await getSecrets();
  if (!secrets.adminPin || secrets.adminPin === pin) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
}
