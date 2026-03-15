const DB_URL = 'https://gasto-flujo-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { uid, subscription } = req.body;
  if (!uid || !subscription) {
    return res.status(400).json({ error: 'Faltan uid o subscription' });
  }

  const secret = process.env.FIREBASE_DB_SECRET;
  const url = `${DB_URL}/usuarios/${uid}/pushSubscription.json?auth=${secret}`;

  try {
    const r = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!r.ok) throw new Error(`Firebase error: ${r.status}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
