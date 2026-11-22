# Amanat: research findings and gap analysis

November 2026. Figures and rules are from regulator, parliamentary and press sources listed at the end. Totals vary by source and date, so treat them as indicative.

## 1. The problem

India loses family wealth at the moment of transfer, in two separate ways.

**Money that nobody claims.** The Finance Minister put unclaimed financial assets at ₹1.84 lakh crore in October 2025; later estimates are near ₹2.2 lakh crore. The large pools:

| Pool | Approximate size | Where it sits |
|---|---|---|
| Bank deposits, 10+ years dormant | ₹78,000 crore to ₹97,500 crore | RBI's DEA Fund, searchable on UDGAM |
| Life insurance proceeds | ₹9,000 crore to ₹14,000 crore | Insurers, searchable on Bima Bharosa |
| Shares and dividends | ₹9,000 crore in dividends, plus shares | IEPF |
| Mutual funds | About ₹3,000 crore | AMCs, searchable on MITRA |
| EPF, EPS pension, EDLI | Not published as one figure | EPFO inoperative accounts |

The "Your Money, Your Right" drive (from October 2025) returned about ₹2,000 crore in its first two months and ₹6,453 crore by April 2026. That is a small fraction of the pool. A Common Landing Portal launched on 29 May 2026 gives one search across deposits, insurance, shares, dividends and mutual funds. It does not cover EPF, NPS, pensions or property, and a Supreme Court PIL argues that it is still not the unified name-based database the government promised.

**Money that is claimed, but fought over.** About 85% of Indians have no will. Around two-thirds of civil cases in district courts concern land and property, and land disputes can take about 20 years to resolve. Since *Shakti Yezdani v. Jayanand Salgaonkar* (Supreme Court, December 2023), a nominee is a custodian who holds the asset for the legal heirs, not its owner. Most families believe the opposite, so a nominee often keeps something the law gives to several people.

**The root cause.** Every rail in India's financial data stack (Account Aggregator, CAS, UDGAM, DigiLocker) authenticates the living holder through their own mobile number. When the holder dies, that credential goes with them, and nobody else knows where to look.

## 2. What changed recently (and the prototype now reflects)

| Change | Date | Effect |
|---|---|---|
| Banking Laws (Amendment) Act 2025 | In force 1 Nov 2025 | Up to four nominees per bank account, simultaneous (with percentage shares) or successive. Lockers allow successive nominees. |
| RBI directions on deceased customers' claims | Sept 2025 | Settlement within 15 days of a complete claim. Where there is no nominee, a simplified procedure without a succession certificate up to at least ₹15 lakh (₹5 lakh at co-operative banks). |
| SEBI nomination revamp | Circular Jan 2025 | Up to 10 nominees for demat and mutual funds. Some provisions deferred in Dec 2025; a March 2026 consultation proposes a cap of four. |
| IRDAI master circular | 2024 | Death claims needing no investigation are settled within 15 days of complete documents. |
| Common Landing Portal | 29 May 2026 | One search point for five asset classes. |

## 3. Gaps found in the original prototype

| # | Gap | Why it matters | Status |
|---|---|---|---|
| 1 | Only six asset types (bank, life insurance, MF, demat, EPF, post office) | The highest-value misses were not modelled at all: the EPS-95 family pension, EDLI insurance (₹2.5 to ₹7 lakh with every EPF account, no premium), gratuity, government family pension, NPS/APY, PMJJBY/PMSBY (₹2 lakh each), Sovereign Gold Bonds, lockers, gold, land, vehicles, crypto and liabilities. | **Fixed.** 22 types in six groups, each with its own claim route. |
| 2 | No succession layer | Nominee ≠ owner after the 2023 ruling. With no will (85% of people), personal law decides, and the app never computed who the heirs are. | **Fixed.** "Family & will" works out intestate shares under Hindu, Muslim (Hanafi, approximate), Indian Succession Act and Parsi rules, draws the family tree, and flags each holding where the nominee is not the only heir. |
| 3 | Nominee conflicts not detected | This is where most family disputes start. | **Fixed.** Conflicts are listed per holding. They correctly exclude beneficial nominees: life cover naming a spouse, parent or child (Insurance Act s.39(7), 2015 amendment), and statutory family benefits (EPS, EDLI, government family pension). |
| 4 | Will-only assets ignored | Land, gold and digital assets have no nomination system. Only a will moves them as intended. | **Fixed.** They are flagged until a will is recorded; readiness now scores the will and nominee alignment. |
| 5 | Generic claim packs | Every institution asked for the same five documents. Families file Form 20 for PF and leave the pension (10D) and insurance (5IF) unclaimed. | **Fixed.** Per-asset forms (20/10D/5IF composite, ISR-5, IEPF-5, Form 11, Form J/K, Form 31, mutation, probate) and per-asset document lists. |
| 6 | No escalation path | Claims stall at the branch, and families give up. | **Fixed.** RBI Ombudsman, Bima Bharosa / Insurance Ombudsman, SEBI SCORES / SMART ODR, EPFiGMS, NPS grievance, CPGRAMS, with quotable timelines. |
| 7 | Discovery interview missed job type, gold, property, vehicles and loans | Job type alone decides which pensions exist. | **Fixed.** Five new questions, each generating ranked leads. |
| 8 | Outdated rules and portals | Thresholds were described as "set by each bank"; no Common Landing Portal, NPS, land records, Parivahan or credit report route. | **Fixed.** |
| 9 | Nothing live | Every lookup was simulated. | **Partly fixed.** Live IFSC branch lookup, PIN code to post office and state land portal, and mutual fund scheme search to registrar (CAMS or KFintech). An AI claims assistant grounded in the case. |

## 4. What still cannot be done without regulated access

| Capability | What it needs |
|---|---|
| Pull actual holdings for the living holder | Account Aggregator FIU licence (via Sahamati); NSDL/CDSL CAS API partnership |
| Verify a death certificate | DigiLocker Requestor Organisation status; integration with the Civil Registration System |
| Search UDGAM, IEPF, Bima Bharosa, EPFO or the Common Landing Portal programmatically | None of these has a public API. This needs a regulator partnership or an assisted-filing model |
| Verify PAN and name | A licensed PAN verification API (NSDL/Protean, or a KYC provider) |
| Propagate a death to every institution | Today this exists only for securities, through the KRA mechanism (SEBI, January 2024). Banks, insurers and EPFO each need it separately |

## 5. How to take this across India

**Product shape.** A free consumer web app and Android app with two journeys (protect while living, recover after a death), plus a paid assisted-recovery service for families who need someone to file and follow up.

**Distribution.** Reach people where the money already is:
- Banks, insurers and AMCs embed "Protect" in onboarding and nomination updates. The four-nominee and ten-nominee rules force every customer to revisit nominations, which is the natural moment.
- Employers and HR platforms embed it alongside EPF, gratuity and group cover. This is where EPS and EDLI are lost.
- Common Service Centres, bank mitras and post offices for assisted recovery in smaller towns, where post office savings and land dominate.

**Language and access.** Hindi plus at least eight regional languages before launch, voice input, low-bandwidth pages, and an assisted mode where a CSC operator fills the case on a family's behalf.

**Trust.** No balances stored, two independent death reports before disclosure, an append-only audit log, data stored in India, consent under the DPDP Act 2023, and an independent security audit before any regulated integration.

**Revenue.** Free for families. B2B fees from institutions (a lower unclaimed book is a regulatory goal for them), a success fee on assisted recoveries capped and disclosed up front, and will-drafting partnerships.

**Policy asks.** A death-event API from the Civil Registration System to all regulated entities; Common Landing Portal coverage of EPF, NPS and government pensions; and a nominee-alignment prompt at the point of nomination.

## 6. Production architecture (suggested)

- **Client:** React or Next.js web, React Native or Flutter mobile, sharing one API.
- **Backend:** Node or Python service; Postgres with per-user row encryption; documents in object storage with client-side encryption.
- **Integrations, in order of effort:** IFSC, PIN code and AMFI (done in the prototype) → PAN verification → DigiLocker → Account Aggregator → regulator partnerships.
- **AI:** a claims assistant grounded in the case file and a maintained rules table (as in the prototype), drafting letters and grievances. It never invents form numbers or deadlines.

## Sources

- [Business Today: ₹2.2 lakh crore unclaimed (Apr 2026)](https://www.businesstoday.in/personal-finance/news/story/rs-22-lakh-crore-unclaimed-funds-lie-idle-across-banks-epf-insurance-stocks-mfs-524958-2026-04-10)
- [Business Today: ₹1.84 lakh crore, campaign launch (Oct 2025)](https://www.businesstoday.in/personal-finance/banking/story/finance-minister-launches-rs-1-84-lakh-crore-unclaimed-assets-campaign-496827-2025-10-04)
- [PIB backgrounder on unclaimed assets](https://pib.gov.in/PressReleasePage.aspx?PRID=2208730)
- [Business Standard: ₹2,000 crore returned in Oct–Nov 2025](https://www.business-standard.com/finance/news/unclaimed-assets-worth-2-000-cr-provided-to-rightful-owners-in-oct-nov-125120901007_1.html)
- [News On AIR: Common Landing Portal launched](https://newsonair.gov.in/government-launches-portal-for-search-of-unclaimed-financial-assets/)
- [Moneylife: Supreme Court reserves order on single database PIL](https://www.moneylife.in/article/over-1-lakh-crore-in-unclaimed-financial-assets-supreme-court-reserves-order-on-sucheta-dalals-plea-for-single-database/82205.html)
- [RBI: Settlement of claims in respect of deceased customers, 2025](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12901)
- [PIB: Banking Laws (Amendment) Act nomination provisions](https://pib.gov.in/PressReleasePage.aspx?PRID=2198614)
- [Moneylife: SEBI allows up to 10 nominees](https://moneylife.in/article/sebi-allows-up-to-10-nominees-in-mutual-funds-demat-accounts/76086.html)
- [Upstox: SEBI proposes cap of four nominees (Mar 2026)](https://upstox.com/news/business-news/financial-regulations/fewer-nominee-details-new-cap-what-changes-sebi-is-proposing-for-demat-accounts-mf-investors/article-190832)
- [SCC Online: Shakti Yezdani v. Jayanand Salgaonkar](https://www.scconline.com/blog/wp-json/wp/v2/posts/267819)
- [Business Today: 80%+ of Indians have no will](https://www.businesstoday.in/personal-finance/retirement-planning/story/expecting-an-inheritance-80-indians-still-dont-have-a-will-study-finds-534568-2026-06-03)
- [Business Today: EPF death claim guide](https://www.businesstoday.in/personal-finance/story/epf-death-claim-guide-how-families-can-access-a-deceased-members-pf-pension-insurance-benefits-545287-2026-07-27)
- [Outlook Money: families unaware of ₹7 lakh EDLI cover](https://www.outlookmoney.com/amp/story/personal-finance/epf-account-holders-may-have-rs-7-lakh-life-cover-but-many-families-do-not-know-it)
- [Daksh/Carnegie: land litigation in India](https://carnegieendowment.org/india/events/2021/09/land-litigation-in-india-learnings-from-a-study-on-land-litigation-in-delhi)
- [Inc42: Yellow and the estate planning market](https://inc42.com/startups/how-yellow-plans-to-bring-order-to-estate-planning)
