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

  const apiKey = process.env.RESEND_API_KEY;
  const fizEmail = process.env.FIZ_EMAIL;
  const risEmail = process.env.RIS_EMAIL;

  if (!apiKey || !fizEmail || !risEmail) {
    return res.status(500).json({
      success: false,
      message: 'Messaging is not configured on the server yet.',
    });
  }

  const to = recipient === 'ris' ? risEmail : fizEmail;
  const sender = from === 'Ris' ? 'Ris' : 'Fiz';
  const subject = sender === 'Ris' ? 'A message from Ris' : 'A message from Fiz';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RisFiz <onboarding@resend.dev>',
        to: [to],
        subject,
        text: String(message).trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
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
