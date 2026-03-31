import { getSecrets } from './_lib/secrets';

export default async function handler(req: any, res: any) {
  const { game, uid, zone } = req.query;
  const secrets = await getSecrets();
  const apiKey2 = secrets.apiKey2 || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4';
  
  if (!game || !uid) {
    return res.status(400).json({ error: 'Game and UID are required' });
  }

  try {
    const gameMap: Record<string, string> = {
      'freefire': 'freefire',
      'mlbb2': 'ml',
      'codm': 'codm',
      'aov': 'aov'
    };

    const mappedGame = gameMap[game as string];

    if (!mappedGame) {
      return res.status(400).json({ error: 'Invalid game selected' });
    }

    const payload: any = {
      game: mappedGame,
      id: uid,
      apikey: apiKey2
    };

    if (mappedGame === 'ml' && zone) {
      payload.zoneid = zone;
    }

    const response = await fetch('https://api.velixs.com/idgames-checker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VelixsAPI-Key': apiKey2
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error checking game ID:', error);
    res.status(500).json({ error: 'Failed to check game ID' });
  }
}
