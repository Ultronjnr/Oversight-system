const users = require('../netlify/functions/users.cjs');

(async () => {
  try {
    const raw = process.argv[2];
    if (!raw) {
      console.error('No event provided');
      process.exit(2);
    }
    const event = JSON.parse(raw);
    const res = await users.handler(event, {});
    console.log(JSON.stringify(res));
  } catch (e) {
    console.error('Error invoking users function:', e);
    process.exit(1);
  }
})();
