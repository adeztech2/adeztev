# ADEZ TV delivery outcomes

## Secure live API integration
- [ ] ADEZ TV loads the Megan Movies home feed through a same-origin server route, with the upstream API key kept server-side and never shipped to the browser.
- [ ] The server exposes a health route and a validated movie/TV detail proxy that returns live upstream metadata or a clear error response.
- [ ] The server exposes a validated streaming proxy that keeps the Megan API key server-side and forwards the provider's stream list for movies or requested TV season/episode.

## Cinematic home experience
- [ ] The home screen presents a dark, premium, cinematic hero section with featured artwork, title, year/type/rating metadata, watch and save actions, and live detail copy when available.
- [ ] Horizontal rails present trending, new, popular, top-rated, and curated genre collections from the live home feed.

## Discovery controls
- [ ] Users can search the loaded catalog and see responsive result cards without leaving the page.
- [ ] Users can switch between Home, Movies, Series, and My List views.
- [ ] Users can filter by available genre rails and clear the active filter.

## Detail view and personal list
- [ ] Selecting a title opens a full detail view with artwork, metadata, synopsis, ratings, genres, runtime, cast, and related titles when the API provides them.
- [ ] Both “Watch now” actions open a dedicated watch route with a real HTML5 video player, poster, loading/error states, source selection when available, and TV season/episode controls.
- [ ] Users can add or remove titles from a locally persisted My List, with clear saved-state feedback.

## Responsive polish
- [ ] Desktop and mobile layouts both have usable navigation, card sizing, rail scrolling, search controls, and detail actions.
- [ ] The route manifest stays synchronized with the single-page route set.
