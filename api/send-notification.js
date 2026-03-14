const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:bigio_tec@me.com',
    'BKowGpFdqzAFG_HrJfFUKMKWdVwwZytU5DGDHMCEqutecTjcJk9P7Xs_cOFaU6oRhjuMUR-h2tebYrvZ29pRU0Y',
    '4wkHnqQhw0yw-PpQmzQ2aDagzcD7XWnp25JtApbuRW8'
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subscriptions, title, body } = req.body;
        if (!subscriptions || !Array.isArray(subscriptions) || !title || !body) {
            return res.status(400).json({ error: 'Missing subscriptions, title, or body' });
        }

        const payload = JSON.stringify({ title, body });
        let sent = 0;
        let failed = 0;

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
                sent++;
            } catch (err) {
                failed++;
            }
        }

        return res.status(200).json({ sent, failed });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
