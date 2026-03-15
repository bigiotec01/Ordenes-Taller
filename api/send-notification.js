const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tokens, title, body } = req.body;
        if (!tokens || !Array.isArray(tokens) || !title || !body) {
            return res.status(400).json({ error: 'Missing tokens, title, or body' });
        }

        let sent = 0;
        let failed = 0;

        for (const token of tokens) {
            try {
                await admin.messaging().send({
                    token,
                    data: { title: String(title), body: String(body) },
                    webpush: {
                        headers: { Urgency: 'high' }
                    }
                });
                sent++;
            } catch (err) {
                failed++;
                // Remove invalid tokens from Firestore
                if (err.code === 'messaging/registration-token-not-registered' ||
                    err.code === 'messaging/invalid-registration-token') {
                    const usersSnap = await admin.firestore().collection('users')
                        .where('fcmToken', '==', token).get();
                    usersSnap.forEach(d => d.ref.update({ fcmToken: null }));
                }
            }
        }

        return res.status(200).json({ sent, failed });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
