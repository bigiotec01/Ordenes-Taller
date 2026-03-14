module.exports = (req, res) => {
    try {
        const webpush = require('web-push');
        const admin = require('firebase-admin');
        res.status(200).json({
            ok: true,
            webpush: typeof webpush.sendNotification,
            admin: typeof admin.initializeApp,
            envKeys: Object.keys(process.env).filter(k => k.startsWith('FIREBASE') || k.startsWith('VAPID'))
        });
    } catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 3) });
    }
};
