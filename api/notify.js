const webpush = require('web-push');

const DB_URL = 'https://gasto-flujo-default-rtdb.firebaseio.com';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Helpers de fecha ──────────────────────────────────────────────
function diasHastaDia(dia) {
  const h   = new Date();
  const hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const t   = new Date(h.getFullYear(), h.getMonth(), parseInt(dia) || 1);
  if (t < hoy) t.setMonth(t.getMonth() + 1);
  return Math.round((t - hoy) / 86400000);
}
function diasHastaFecha(fechaStr) {
  const h   = new Date();
  const hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const t   = new Date(fechaStr + 'T00:00:00');
  return Math.round((t - hoy) / 86400000);
}

// Avanza una fecha por un paso de frecuencia
function advanceDate(date, freq) {
  const next = new Date(date);
  if (freq === 'weekly')      { next.setDate(next.getDate() + 7); return next; }
  if (freq === 'biweekly')    { next.setDate(next.getDate() + 14); return next; }
  if (freq === 'semimonthly') {
    const d = next.getDate();
    return d <= 15
      ? new Date(next.getFullYear(), next.getMonth() + 1, 0)
      : new Date(next.getFullYear(), next.getMonth() + 1, 15);
  }
  if (freq === 'monthly') { next.setMonth(next.getMonth() + 1); return next; }
  return next;
}

// Verifica si hoy es día de cobro para un ingreso
function isPaydayToday(inc) {
  if (!inc.date || !inc.freq || inc.freq === 'once') return false;
  const hoy      = new Date();
  const todayMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let next = new Date(inc.date + 'T00:00:00');
  if (isNaN(next)) return false;
  let iter = 0;
  while (next < todayMid && iter < 200) {
    iter++;
    next = advanceDate(next, inc.freq);
  }
  return next.getTime() === todayMid.getTime();
}

// ── Handler principal ─────────────────────────────────────────────
module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const dbSecret = process.env.FIREBASE_DB_SECRET;
    const r = await fetch(`${DB_URL}/usuarios.json?auth=${dbSecret}`);
    if (!r.ok) throw new Error(`Firebase error: ${r.status}`);
    const usuarios = await r.json() || {};

    const results = [];

    for (const [uid, data] of Object.entries(usuarios)) {
      const subscription = data.pushSubscription;
      if (!subscription || !subscription.endpoint) continue;

      const deudas  = data.deudas  || [];
      const incomes = data.incomes || [];

      // ── Vencimientos de hoy y mañana ──
      const allDue = [];
      deudas
        .filter(d => !d.pagado && !d.isPaid && (d.expType || 'monthly') !== 'perPaycheck')
        .forEach(d => {
          let dias = null;
          const expType = d.expType || (d.esFijo ? 'monthly' : 'once');
          if (expType === 'monthly' && (d.diaFijo || d.day)) dias = diasHastaDia(d.diaFijo || d.day);
          else if (expType === 'once' && (d.fechaPago || d.dateFull)) dias = diasHastaFecha(d.fechaPago || d.dateFull);
          if (dias === 0 || dias === 1) allDue.push({ ...d, dias });
        });

      for (const d of allDue) {
        const nombre = d.nombre || d.name || 'Gasto';
        const monto  = Number(d.monto || d.amount || 0);
        const title  = d.dias === 0 ? `🚨 HOY vence: ${nombre}` : `⚠️ Mañana vence: ${nombre}`;
        const body   = d.dias === 0 ? `¡Paga hoy! — $${monto.toFixed(2)}` : `Prepara $${monto.toFixed(2)} para mañana`;

        try {
          await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
          results.push({ uid, nombre, dias: d.dias, sent: true });
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await fetch(`${DB_URL}/usuarios/${uid}/pushSubscription.json?auth=${dbSecret}`, { method: 'DELETE' });
          }
          results.push({ uid, nombre, sent: false, error: e.message });
        }
      }

      // ── Notificación de día de cobro ──
      const payIncome = incomes.find(inc => isPaydayToday(inc));
      if (payIncome) {
        const monto = Number(payIncome.amount || 0);
        try {
          await webpush.sendNotification(subscription, JSON.stringify({
            title: `💰 ¡Hoy cobras!`,
            body:  `${payIncome.name || 'Tu cheque'} — $${monto.toFixed(2)} disponibles`
          }));
          results.push({ uid, nombre: payIncome.name, tipo: 'payday', sent: true });
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await fetch(`${DB_URL}/usuarios/${uid}/pushSubscription.json?auth=${dbSecret}`, { method: 'DELETE' });
          }
          results.push({ uid, nombre: payIncome.name, tipo: 'payday', sent: false, error: e.message });
        }
      }
    }

    res.json({ ok: true, sent: results.filter(r => r.sent).length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
