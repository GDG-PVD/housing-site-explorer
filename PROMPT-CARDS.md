# Site Explorer prompt cards

Open Site Explorer, click **Remix**, then paste one prompt at a time into the chat. After each change, try it on a real address.

## Challenge 1: What can be built at this site?
1. "Show the zoning district for this address if you can find it, and link to the section of the town's ordinance that covers it."
2. "Add a panel listing what to check for this lot: minimum lot size, setbacks, height limit, and how many units are allowed by right. Leave a blank for each value and a link to where to find it."
3. "Add a note on Rhode Island's 2024 to 2026 housing reforms that might change what this lot can hold, such as accessory dwelling units."

## Challenge 2: What does it take to get approved?
1. "Add an 'Approvals checklist' tab: the permits and reviews a small multifamily project in this town would likely need, in order, with who to contact at the town."
2. "For each step, add a typical timeline and what documents are usually needed. Mark anything you are unsure about as 'confirm with the town'."
3. "Add a button that turns the checklist into a one-page summary I can print."

## Challenge 3: How does this project get funded?
1. "Add a 'Funding' tab listing Rhode Island programs that could fund affordable housing at this site, such as RIHousing programs and housing tax credits, with a link to each program's source page."
2. "For each program, show who can apply, roughly how much, and the next deadline if one is published. Say 'check the source' when you are not sure."
3. "Add a simple calculator: total project cost minus each selected funding source, showing the remaining gap."

## Any challenge: reach more people
The summary card already has a language picker: it sends the text to Gemini through `/api/translate` and caches each language. The same step works for anything on the page.
1. "When I pick a language in the summary card, translate the zoning card and the nearby places list too. Keep street names, place names and links as they are."
2. "Translate my challenge tab into the selected language, including the printout."
3. "Add a one-page flyer for neighbors about this site, in the selected language, in plain words a non-expert can follow."

## Any challenge: compare models
The summary card has a model menu. Models other than Gemini need your team's OpenRouter key under Settings, then Secrets, as `OPENROUTER_API_KEY`.
1. "Compare models: summarize the same address with two models side by side and show both. Let me pick the two models from the model list, and label each summary with the model that wrote it."
