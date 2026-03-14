const admin = require('firebase-admin');
const webpush = require('web-push');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const VAPID_PUBLIC_KEY = 'BKowGpFdqzAFG_HrJfFUKMKWdVwwZytU5DGDHMCEqutecTjcJk9P7Xs_cOFaU6oRhjuMUR-h2tebYrvZ29pRU0Y';

webpush.setVapidDetails(
    'mailto:bigio_tec@me.com',
    VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(token);

        const { taller, createdBy, excludeUid, title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Missing title or body' });
        }

        // Find users to notify
        const usersToNotify = new Map();

        // 1. Customers with matching taller
        if (taller) {
            const tallerSnap = await admin.firestore().collection('users')
                .where('taller', '==', taller).get();
            tallerSnap.forEach(d => {
                if (d.id !== excludeUid && d.data().pushSub) {
                    usersToNotify.set(d.id, d.data().pushSub);
                }
            });
        }

        // 2. Order creator
        if (createdBy && createdBy !== excludeUid) {
            const creatorDoc = await admin.firestore().collection('users').doc(createdBy).get();
            if (creatorDoc.exists && creatorDoc.data().pushSub) {
                usersToNotify.set(createdBy, creatorDoc.data().pushSub);
            }
        }

        if (usersToNotify.size === 0) {
            return res.status(200).json({ sent: 0, message: 'No subscribers' });
        }

        // Send notifications
        const payload = JSON.stringify({ title, body });
        let sent = 0;
        let failed = 0;

        for (const [uid, sub] of usersToNotify) {
            try {
                const subscription = typeof sub === 'string' ? JSON.parse(sub) : sub;
                await webpush.sendNotification(subscription, payload);
                sent++;
            } catch (err) {
                failed++;
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await admin.firestore().collection('users').doc(uid)
                        .update({ pushSub: admin.firestore.FieldValue.delete() })
                        .catch(() => {});
                }
            }
        }

        return res.status(200).json({ sent, failed });
    } catch (e) {
        console.error('send-notification error:', e);
        return res.status(500).json({ error: e.message });
    }
};
