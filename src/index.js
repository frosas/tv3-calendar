const express = require('express');
const nodeUtil = require('util');
const util = require('./util');
const getCalendar = require('./get-calendar');
const channels = require('./channels');

// Show stack trace and end process
process.on('unhandledRejection', error => { throw error; });

const retriedGetCalendar = util.retryify(async ({error, attempt, args}) => {
  if (error) console.error(error);
  if (attempt > 1) await util.delay(10 /* seconds */ * 1000);
  return getCalendar(...args);
});

(async () => {
  const whenCalendarsByChannel = {};
  (async function updateCalendars() {
    Object.entries(channels).forEach(([channelId, channel]) => {
      whenCalendarsByChannel[channelId] = retriedGetCalendar(channel);
    });
    // Avoid potential calls overlapping by not scheduling the next run until the
    // current one is over.
    setTimeout(updateCalendars, 10 /* min */ * 60 * 1000);      
    await util.everyPromise(Object.values(whenCalendarsByChannel));
  })();

  // Note we start the server without waiting for the calendar to be obtained.
  // Instead, we use its promise to serve it once it resolves.
  console.log('Starting server...');
  const app = express();
  app.set('views', `${__dirname}/views`);
  app.set('view engine', 'ejs');
  app.get('/', (req, res) => res.render('index', {channels}));
  app.get('/ics', (req, res) => res.redirect('/ics/tv3'));
  app.get('/ics/:channelId', async (req, res) => {
    (await whenCalendarsByChannel[req.params.channelId]).serve(res);
  });
  await nodeUtil.promisify(app.listen.bind(app))(process.env.PORT || 80);
  console.log('Server started');
})();