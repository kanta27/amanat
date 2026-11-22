# Amanat · अमानत

**Nothing a family owns should be lost because nobody knew it existed.**

Live prototype: **https://kanta27.github.io/amanat/**

Amanat is a prototype for one of the quieter gaps in Indian personal finance. Around ₹2.2 lakh crore sits unclaimed across banks, insurers, mutual funds, shares and provident funds. Most of it isn't lost in any real sense. The family it belongs to simply can't find it.

The root cause is structural. Every rail in India's financial data stack (Account Aggregator, CAS, UDGAM, DigiLocker) authenticates the *living* account holder through their own registered mobile number. When that person dies, the one credential the whole stack depends on goes with them.

*Amanat* (Urdu/Hindi): something entrusted to another's safekeeping. Under Indian law, that is exactly a nominee's position: custodian of an asset on behalf of the legal heirs.

---

## Two journeys

### 1. Protect what I hold
For the living holder. Record **where** each holding sits and **who should be told**. Balances are deliberately left out.

- **Readiness score**: how much of the registry would actually reach the family today.
- **What is missing**: gaps ordered by severity. *No nominee designated* comes before *not nominated at the institution*, because the first is the one that loses money.
- **Per-person disclosure scope**: *Full detail*, *Existence only* or *Claim guidance only*, set separately for each person on each holding.
- **Safeguards**: two independent death reporters, a waiting period, alerts to the holder's own contacts, and an append-only audit log.
- **Disclosure simulation**: see exactly what each family member would receive.

### 2. Find what was left behind
For the family after a death. It handles both cases in one place.

**Step 1: Did they use Amanat?** Enter their PAN and your mobile number.
- **They kept a registry and named you.** Report the death, wait for a second report, then see only the holdings they set aside for you, with the claim route for each.
- **They kept one but didn't name you.** Nothing is shown.
- **No registry.** The common case. Go straight to the search.

**Then search for everything else**, with what's already known filled in:
- An 11-question discovery interview that produces a **ranked search plan**.
- **The tax-records route.** A legal heir can register as a *Representative Assessee* on the income tax portal and open the deceased's Form 26AS and AIS. These list every bank that paid them interest and every company that paid them a dividend, which amounts to an asset map almost no family knows exists.
- **Evidence kit**: email search terms, bank-statement clues and a checklist for old paperwork.
- **Portal router**: UDGAM, IEPF, Bima Bharosa, MITRA / MF Central and EPFO, with what each one needs and returns.
- **Case file and documents**: claim status per institution, and the documents each claim requires depending on whether a nomination exists.

---

## What is real and what is simulated

| | Status |
|---|---|
| All product logic, scoring, disclosure rules, search-plan ranking | Real |
| Links to UDGAM, IEPF, Bima Bharosa, MITRA, EPFO, income tax portal | Real (open the live portals) |
| Account Aggregator pull of holdings | Simulated: needs FIU registration |
| Death-certificate verification | Simulated: needs DigiLocker Requestor Organization status |
| Cross-institution death propagation | Out of scope: exists today only for securities, via SEBI's KRA mechanism (Jan 2024) |
| Portal searches | Not automated: none of these portals has a public API |

Every simulated step is labelled in the UI.

## Design choices worth defending

- **No balances, anywhere.** They go stale immediately, and a list of what someone owns with amounts attached is a target.
- **The gap audit is the landing screen, not the asset form.** It's the only part that gives the living user a reason of their own to keep the registry up to date.
- **Disclosure scope lives on the designation, not the asset.** A spouse can see everything while a child sees one policy.
- **Two independent reports before anything is disclosed.** A wrongly disclosed asset map can't be undone; a delayed one can still be claimed.
- **Recovery starts with questions, not a form.** "I don't know" is an accepted answer that widens the search rather than skipping a category.

## Run it

It's a single static page: open `index.html` in a browser, or serve the folder. Data is saved in your browser's local storage. **Reset prototype** in the sidebar clears it.

## Tests

```bash
npm install
npm test
```

162 headless checks across three suites. They cover the registry, the disclosure rules (including that nothing is shown before two reports, and that other family members' holdings never appear), the registry lookup, the merged search, persistence and reset; the heir-share arithmetic under each personal law, nominee conflicts, will gaps, the wider asset types and leads, claim routes and escalation; and the live lookups and assistant, with the network and AI mocked.

## Added in November 2026

See [docs/RESEARCH.md](docs/RESEARCH.md) for the research, the gap analysis and the plan for rolling this out across India.

- **22 asset types** in six groups, including EPS-95 family pension, EDLI insurance, gratuity, government family pension, NPS/APY, PMJJBY/PMSBY, Sovereign Gold Bonds, lockers, gold, land, vehicles, crypto and loans.
- **Family & will.** Intestate shares under Hindu, Muslim, Indian Succession Act and Parsi rules, a family tree, and a check of each nominee against the legal heirs (*Shakti Yezdani*, 2023). Beneficial insurance nominees and statutory family benefits are correctly excluded.
- **Per-asset claim routes**: forms, documents, timelines and the regulator to escalate to.
- **Live lookups** (public APIs, no keys): IFSC to branch (Razorpay IFSC), PIN code to post offices and the state land-records portal (India Post), and scheme name to fund house and registrar (mfapi.in / AMFI).
- **Ask Amanat**: an AI claims assistant grounded in the case file and the rules table. It runs where the Claude artifact runtime is present and says so plainly elsewhere.

## Credits

Illustrations from the Canva template *"Insurance for Every Stage of Life"* (Canva content library), used here for a non-commercial case study.

Figures on unclaimed assets are from parliamentary and regulator disclosures as reported in December 2025.
