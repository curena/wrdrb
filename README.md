# wrdrb

Personal wardrobe manager: a mobile-first PWA that keeps an inventory of your
clothing and recommends outfits with an explainable, rule-based matching engine
(color theory, formality, season, availability, recency).

See [CLAUDE.md](./CLAUDE.md) for the product scope, domain model, matching
rules, and architecture decisions.

## Development

```bash
npm install
npm run dev        # start the app at http://localhost:3000
npm test           # run the matching-engine unit tests
npm run db:push    # create/update the local SQLite db (data/wrdrb.db)
npm run build      # production build
```
