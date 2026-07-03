# Bedrijfs Command Center

Eén dashboard waarin een ondernemer zijn hele bedrijf in de gaten houdt — zonder tien tabbladen te checken:

- **AI-ochtendbriefing** — elke ochtend één samenvatting: *dit moet je vandaag weten*, met concrete acties.
- **Omzet** — dagelijkse omzet met trend en vergelijking met de vorige periode.
- **Klantenservice** — tickets per dag, met automatische piekdetectie (bijv. "40% meer klachten dan normaal").
- **Voorraad** — per product hoeveel dagen voorraad er nog is bij het huidige verkooptempo.
- **Personeelsbezetting** — wie er vandaag staat ingeroosterd, per afdeling.
- **AI-signaleringen** — automatische afwijkingen met urgentieniveau (urgent / actie nodig / let op / op koers).

De app draait nu op demo-data; de datalaag zit in `lib/data.ts` en is voorbereid om te koppelen aan kassa-, helpdesk-, voorraad- en roostersystemen.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 met eigen design tokens (licht & donker)
- Grafieken in pure SVG — geen chart-library nodig

## Ontwikkelen

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
