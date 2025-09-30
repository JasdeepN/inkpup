export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  // In production wire this to an email provider (SendGrid, Mailgun) or store in DB
  console.log('Contact form received', { name, email, message });

  return res.status(200).json({ ok: true });
}
