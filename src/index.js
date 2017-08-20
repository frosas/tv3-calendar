const ical = require('ical-generator');
const http = require('http');
const getEpisodes = require('./get-episodes');

(async () => {
  console.log('Retrieving episodes...');
  const calendar = ical({name: 'Programació de TV3'});
  (await getEpisodes()).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: episode.title
    });
  });
  console.log('Starting server...');
  http
    .createServer((req, res) => calendar.serve(res))
    .listen(process.env.PORT || 80);
  console.log('Done');
})();