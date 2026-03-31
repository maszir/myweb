import { Readable } from 'stream';

export default async function handler(req: any, res: any) {
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
    
    if (contentType && contentType.includes('text/html')) {
      return res.status(400).send('The URL provided is a webpage, not a media file.');
    }

    let safeFilename = (filename as string || 'download').replace(/[^a-z0-9.]/gi, '_');
    
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
}
