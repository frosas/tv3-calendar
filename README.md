# TV3 Guide Calendar

**Calendars (in iCalendar format) for the channels of Catalan TV network [TV3](http://www.ccma.cat/tv3/).**

**Public version available at http://tv3-guide-calendar.frosas.net**

This project is just an excuse for me to play with [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## Development

```bash
$ PORT=5000 DEBUG='app:*,-app:getEpisodes' npm run watch
```

## TODO

- Add all available days.
- Add episode missing details (language(s), age rating, ...)
- Link to a public calendar consuming from this service. I think Google Calendar offers this option. This calendar could work to showcase the service without having to subscribe to it.
- `$ ag ' TODO '`
- How to get notified of issues in production?
- Web crawler to warn about unexpected results (timeouts, missing content, ...)