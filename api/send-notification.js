const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:bigio_tec@me.com',
    'BGaulXsZQCLUFbfhgPAGBZyRvf0LlYMd8_-tLycPOIbWvPiE4Xs9EuWv5bRvXe2VCfgJzgK71AwY5yUKNDVHO8Y',
    'n86Hk8cWlKsKOJS1_n8PLXruFtoeT0M-66gZ2aEIV6c'
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
