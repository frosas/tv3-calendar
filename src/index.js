const ical = require('ical-generator');
const http = require('http');
const getEpisodes = require('./get-episodes');

(async () => {
  const calendar = ical({name: 'Programació de TV3'});
  (await getEpisodes()).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: episode.title
    });
  });
  http
    .createServer((req, res) => calendar.serve(res))
    .listen(process.env.PORT || 5000);
})();