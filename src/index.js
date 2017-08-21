const ical = require('ical-generator');
const express = require('express');
const util = require('util');
const getEpisodes = require('./get-episodes');

const getCalendar = async () => {
  console.log('Retrieving episodes...');
  const calendar = ical({name: 'Programació de TV3'});
  (await getEpisodes()).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: (() => {
        let summary = episode.program.title;
        if (episode.title) summary = `${summary} - ${episode.title}`;
        return summary;
      })(),
      description: episode.description,
      url: episode.program.url
    });
  });  
  console.log('Episodes retrieved');
  return calendar;
}

(async () => {
  let whenCalendar;
  (async function _updateCalendar() {
    whenCalendar = getCalendar();
    // Avoid potential calls overlapping by not scheduling the next run until the
    // current one is over.
    await whenCalendar;
    setTimeout(_updateCalendar, 10 /* min */ * 60 * 1000);
  })();

  // Note we start the server without waiting for the calendar to be obtained.
  // Instead, we use its promise to serve it once it resolves.
  console.log('Starting server...');
  const app = express();
  app.get('/ics', async (req, res) => (await whenCalendar).serve(res))
  await util.promisify(app.listen.bind(app))(process.env.PORT || 80);
  console.log('Server started');
})();