import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const secrets = await getSecrets();
  res.json({ needsPin: !!secrets.adminPin });
}
