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

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(token);

        const callerDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
            return res.status(403).json({ error: 'Admin only' });
        }

        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'Missing uid' });
        }

        if (uid === decoded.uid) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await admin.auth().deleteUser(uid);
        return res.status(200).json({ ok: true });
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            return res.status(200).json({ ok: true });
        }
        return res.status(500).json({ error: e.message });
    }
};
