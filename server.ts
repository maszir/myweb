import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(process.cwd(), 'firebase-applet-config.json');

const app = express();
app.use(cors());
app.use(express.json());

// Helper to get Firebase config
const getFirebaseConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed to read firebase-applet-config.json', err);
    return null;
  }
};

const getSecrets = async () => {
  // Check environment variables first (most permanent)
  if (process.env.ADMIN_PIN || process.env.SANKA_API_KEY || process.env.VELIXS_API_KEY) {
    return {
      apiKey: process.env.SANKA_API_KEY || 'planaai',
      apiKey2: process.env.VELIXS_API_KEY || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4',
      adminPin: process.env.ADMIN_PIN || ''
    };
  }

  const config = getFirebaseConfig();
  if (!config) return { apiKey: 'planaai', apiKey2: '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4', adminPin: '' };

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admin/secrets?key=${config.apiKey}`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};
      return {
        apiKey: fields.apiKey?.stringValue || 'planaai',
        apiKey2: fields.apiKey2?.stringValue || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4',
        adminPin: fields.adminPin?.stringValue || ''
      };
    }
  } catch (err) {
    console.error('Failed to fetch secrets from Firestore', err);
  }
  
  return { apiKey: 'planaai', apiKey2: '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4', adminPin: '' };
};

const saveSecrets = async (secrets: any) => {
  const config = getFirebaseConfig();
  if (!config) return;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admin/secrets?key=${config.apiKey}`;
  
  const body = {
    fields: {
      apiKey: { stringValue: secrets.apiKey || '' },
      apiKey2: { stringValue: secrets.apiKey2 || '' },
      adminPin: { stringValue: secrets.adminPin || '' }
    }
  };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Failed to save secrets to Firestore', err);
  }
};

app.get('/api/needs-pin', async (req, res) => {
  const secrets = await getSecrets();
  res.json({ needsPin: !!secrets.adminPin });
});

app.post('/api/verify-pin', async (req, res) => {
  const { pin } = req.body;
  const secrets = await getSecrets();
  if (!secrets.adminPin || secrets.adminPin === pin) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/check-ml', async (req, res) => {
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
});

app.get('/api/check-resi', async (req, res) => {
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
});

app.get('/api/stalk-tiktok', async (req, res) => {
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
});

app.get('/api/download', async (req, res) => {
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
});

app.get('/api/proxy-download', async (req, res) => {
  const { url, filename } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(url as string, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch media: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    // If it's HTML, it's likely not the media file we want
    if (contentType && contentType.includes('text/html')) {
      return res.status(400).send('The URL provided is a webpage, not a media file.');
    }

    let safeFilename = (filename as string || 'download').replace(/[^a-z0-9.]/gi, '_');
    
    // Ensure correct extension based on content type if missing or wrong
    if (contentType) {
      res.setHeader('Content-Type', contentType);
      
      const extMap: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'audio/mpeg': '.mp3',
        'audio/mp3': '.mp3',
        'application/octet-stream': ''
      };

      const expectedExt = extMap[contentType.split(';')[0]];
      if (expectedExt && !safeFilename.toLowerCase().endsWith(expectedExt)) {
        // Remove existing extension if it's different and we're sure about the new one
        const parts = safeFilename.split('.');
        if (parts.length > 1) {
          parts.pop();
          safeFilename = parts.join('.') + expectedExt;
        } else {
          safeFilename += expectedExt;
        }
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    // Use response.body as a stream if possible
    if (response.body) {
      // @ts-ignore
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.status(500).send('Empty response body from source');
    }
  } catch (error) {
    console.error('Proxy download error:', error);
    res.status(500).send('Failed to proxy download');
  }
});

app.get('/api/check-game', async (req, res) => {
  const { game, uid, zone } = req.query;
  const secrets = await getSecrets();
  const apiKey2 = secrets.apiKey2 || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4';
  
  if (!game || !uid) {
    return res.status(400).json({ error: 'Game and UID are required' });
  }

  try {
    // Map frontend game keys to Velixs API game keys
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
});

app.get('/api/admin/secrets', async (req, res) => {
  const pin = req.headers['x-admin-pin'];
  const secrets = await getSecrets();
  if (secrets.adminPin && secrets.adminPin !== pin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(secrets);
});

app.post('/api/admin/secrets', async (req, res) => {
  const pin = req.headers['x-admin-pin'];
  const secrets = await getSecrets();
  if (secrets.adminPin && secrets.adminPin !== pin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const newSecrets = { ...secrets, ...req.body };
  await saveSecrets(newSecrets);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
