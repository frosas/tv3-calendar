const ical = require('ical-generator');
const getEpisodes = require('./get-episodes');

const calendar = ical({name: 'Programació de TV3'});

(async () => {
  (await getEpisodes()).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: episode.title
    });
  });
  process.stdout.write(calendar.toString());
})();