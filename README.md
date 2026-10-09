# Site Explorer

Site Explorer is a starter web app for housing practitioners in Rhode Island. Type an address and it shows the site on a map, lists nearby bus stops, schools, grocery stores and parks with walking distances, links to the zoning ordinance of the town the address is in, and writes a short plain-English summary for a housing developer. Zoning links for all 39 Rhode Island municipalities are in `towns.json`.

It is meant to be remixed, not used as-is: teams change it with plain-English prompts in Google AI Studio.

**Open in AI Studio and Remix:** https://ai.studio/apps/fcbdfa66-237e-4e2a-b5b4-090284f9d4bc

Prompts to try after you Remix: [PROMPT-CARDS.md](PROMPT-CARDS.md)

## Google Maps key

The app needs a Google Maps API key and does not contain one. In AI Studio, add it under Settings, then Secrets, with the name `GOOGLE_MAPS_API_KEY`. If no secret is set, the app asks you to paste a key and keeps it in your browser only. Never paste a key into the chat or commit one to a repo.

## Run locally

```
npm install
npm run dev
```

Set `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` in a local `.env.local` file (not committed).

## Disclaimer

The summary always ends with: "This is a starting point, not a zoning determination. Check with the town." Confirm anything that matters with the town.

Built for DevFest Providence 2026, Build for Good: AI Lab for Housing.

Licensed under the Apache License 2.0.
