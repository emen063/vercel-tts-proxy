export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, locale, gender } = req.body;
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    return res.status(500).json({ error: 'Azure credentials not configured' });
  }

  if (!text || !locale) {
    return res.status(400).json({ error: 'Missing text or locale' });
  }

  const ssml = `<speak version='1.0' xml:lang='${locale}'>
    <voice name='${locale}${gender === 'female' ? 'Female' : 'Male'}'>
      ${text}
    </voice>
  </speak>`;

  const azureUrl = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

  try {
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Azure Speech error' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
