const ical = require('ical-generator');
const http = require('http');
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
  return calendar;
}

(async () => {
  let calendar;
  await (async function _updateCalendar() {
    calendar = await getCalendar();
    setTimeout(_updateCalendar, 10 /* min */ * 60 * 1000);
  })();
  console.log('Starting server...');
  http
    .createServer((req, res) => calendar.serve(res))
    .listen(process.env.PORT || 80);
  console.log('Done');
})();