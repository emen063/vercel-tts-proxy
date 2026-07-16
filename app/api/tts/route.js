export async function POST(request) {
  const { text, locale, gender } = await request.json();
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    return Response.json({ error: 'Azure credentials not configured' }, { status: 500 });
  }

  if (!text || !locale) {
    return Response.json({ error: 'Missing text or locale' }, { status: 400 });
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
      return Response.json({ error: 'Azure Speech error' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
