export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { recipient, message, from, _honey } = req.body || {};

  if (_honey) {
    return res.status(200).json({ success: true });
  }

  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, message: 'Please write a message first.' });
  }

  if (String(message).length > 5000) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  if (recipient !== 'fiz' && recipient !== 'ris') {
    return res.status(400).json({ success: false, message: 'Invalid recipient.' });
  }

  const keyToRis = process.env.WEB3FORMS_KEY_TO_RIS;
  const keyToFiz = process.env.WEB3FORMS_KEY_TO_FIZ;
  const accessKey = recipient === 'ris' ? keyToRis : keyToFiz;

  if (!accessKey) {
    return res.status(500).json({
      success: false,
      message: 'Messaging is not configured on the server yet.',
    });
  }

  const sender = from === 'Ris' ? 'Ris' : 'Fiz';
  const subject = sender === 'Ris' ? 'A message from Ris' : 'A message from Fiz';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject,
        message: String(message).trim(),
        from_name: sender,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return res.status(500).json({
        success: false,
        message: data.message || 'Email could not be sent.',
      });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Could not send email.' });
  }
}
