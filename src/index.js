const express = require('express');
const nodeUtil = require('util');
const util = require('./util');
const getCalendar = require('./get-calendar');

// Show stack trace and end process
process.on('unhandledRejection', error => { throw error; });

(async () => {
  const retriedGetCalendar = util.retryify(async ({error, attempt, args}) => {
    if (error) console.error(error);
    if (attempt > 1) await util.delay(10 /* seconds */ * 1000);
    return getCalendar();
  });
  let whenCalendar;
  (async function updateCalendar() {
    whenCalendar = retriedGetCalendar();
    // Avoid potential calls overlapping by not scheduling the next run until the
    // current one is over.
    await whenCalendar;
    setTimeout(updateCalendar, 10 /* min */ * 60 * 1000);      
  })();

  // Note we start the server without waiting for the calendar to be obtained.
  // Instead, we use its promise to serve it once it resolves.
  console.log('Starting server...');
  const app = express();
  app.get('/ics', async (req, res) => (await whenCalendar).serve(res))
  await nodeUtil.promisify(app.listen.bind(app))(process.env.PORT || 80);
  console.log('Server started');
})();