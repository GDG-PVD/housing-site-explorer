# Site Explorer

Site Explorer is a starter web app for housing practitioners in Rhode Island. Type an address and it shows the site on a map, lists nearby bus stops, schools, grocery stores and parks with walking distances, links to the zoning ordinance of the town the address is in, and writes a short plain-English summary for a housing developer. Zoning links for all 39 Rhode Island municipalities are in `towns.json`.

It is meant to be remixed, not used as-is: teams change it with plain-English prompts in Google AI Studio.

**Open in AI Studio and Remix:** https://ai.studio/apps/fcbdfa66-237e-4e2a-b5b4-090284f9d4bc

Prompts to try after you Remix: [PROMPT-CARDS.md](PROMPT-CARDS.md)

## Google Maps key

The app needs a Google Maps API key and does not contain one. In AI Studio, add it under Settings, then Secrets, with the name `GOOGLE_MAPS_API_KEY`. If no secret is set, the app asks you to paste a key and keeps it in your browser only. Never paste a key into the chat or commit one to a repo.

**Restrict your key.** The app hands the key to the browser to draw the map, so anyone who opens a shared copy of your app can read it. The server also uses the same key to look up addresses and nearby places, so leave Application restrictions at None: Google refuses website-restricted keys on server calls, and address search would fail while the map still draws. In the Google Cloud console, open APIs & Services, then Credentials, then your key: under API restrictions allow only the Maps JavaScript, Geocoding, Places API (New) and Places APIs. Then set a low daily quota on each of those APIs, and delete the key after the event.

## Run locally

```
npm install
npm run dev
```

Set `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` in a local `.env.local` file (not committed).

`npm test` checks the town lookup (which of the 39 municipalities an address is in).

## Challenge starters

Want a head start on one of the three challenges? Each starter is this app with the challenge's tab already built, ready to improve:

- [housing-starter-zoning](https://github.com/GDG-PVD/housing-starter-zoning): What can be built at this site?
- [housing-starter-approvals](https://github.com/GDG-PVD/housing-starter-approvals): What does it take to get approved?
- [housing-starter-funding](https://github.com/GDG-PVD/housing-starter-funding): How does this project get funded?

## Disclaimer

The summary always ends with: "This is a starting point, not a zoning determination. Check with the town." Confirm anything that matters with the town.

Built for DevFest Providence 2026, Build for Good: AI Lab for Housing.

Code is licensed under the [Apache License 2.0](LICENSE). Copyright 2026 GDG Providence; see [NOTICE](NOTICE).

Docs and any sample data are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
