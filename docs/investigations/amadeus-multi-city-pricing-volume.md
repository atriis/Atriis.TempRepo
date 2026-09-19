# Amadeus multi-city by schedule: pricing volume and what it costs

Opened while automating ADO Bug **#83329** (NFF Amadeus search by schedule: missing fare brands in
pricing options for multi-city). The test shipped on Iberia content — see TC 84966 — but Delta, the
carrier the bug was raised on, could not be automated, and the reason is worth keeping.

Status: **paused with one question open**. Everything below is measured on staging, 2026-09-18.

## What the flow does

Selecting a multi-city by-schedule itinerary in the new flight flow makes the OBT price the whole
selection **once per fare family**, logging one `Amadeus4.Fare_InformativePricingWithoutPNR (FAMILY)`
call per attempt, plus a `MiniRule_GetFromPricing` per brand card.

Measured per trip, from the distributor log:

| Content | Legs | Pricing replies | Distinct families | MiniRule calls |
|---|---|---|---|---|
| Delta, JFK-ATL-LAX-JFK | 3 | ~99 | 8 | ~91 |
| Delta, JFK-ATL + ATL-LAX | 2 | ~71 | 8 | - |
| Iberia, LIS-MAD + MAD-LIS | 2 | ~46-65 | 8 | - |
| British Airways, LON-MAD + MAD-LIS | 2 | ~35 | 6 | - |

The same family repeats many times within one trip: on a three-leg Delta selection, `MAINCLASC` ×23,
`COMFTCLASC` ×26, `MAINEXTRA` ×25. Only about a third of the replies carry a price; the rest come
back `*NO FARES/RBD/CARRIER/PASSENGER TYPE`.

## Why it matters to a traveller

The brand cards cannot render until that sweep finishes. On the three-leg Delta selection the cards
took **longer than 120 seconds**: two runs failed on a two-minute wait, and the test only passed
after the wait was raised to 180s (`FlightResultsPage.waitForNewFlightFlowBrandCards`). On Iberia
over two legs the same screen renders comfortably.

## The open question

Whether the repetition is a defect or the design:

- **Defect** if the repeated calls of a family are the *same request* - the same segments, the same
  family - in which case this is the pattern ADO **#83755** raised for Sabre NDC ("every fare option
  is priced 2-6 times, adding ~60s to the load"), on another supplier.
- **By design** if each repeat prices a *different combination*, since the by-schedule matrix
  explores combinations across legs and caps at 64 - a count consistent with what was observed.

Nothing here separates the two yet, so no bug has been raised.

### How to answer it

Read the **requests** (not the responses) of one family from a single trip and compare what each
asks for: the flight numbers, the locations, the dates and the fare family criteria. Identical
fingerprints across several calls mean repetition; differing ones mean combinations.

The payload API serves this: `fetchPayloadFromStorage({ source: "request", requestType:
"*Fare_InformativePricingWithoutPNR (MAINCLASC)*", tripId, returnAllMatches: true })`. Four calls
are enough to see the shape. Trips used above: 3871378 and 3871424 (Delta, three legs).

## The other limit, which is ours and not the product's

The internal payload API refuses this volume. Reading every pricing reply of a Delta trip failed
three times in three different ways - HTTP 429, a refused connection, and a timed-out retry - which
is why TC 84966 runs on Iberia. The client now paces bulk downloads and backs off once on 429 (see
PR #331), which is enough for ~60 payloads and not enough for ~71.

Separately, the API's per-trip listing is capped at **200 entries**, newest first, and ignores every
paging or filter parameter tried (`requestType`, `type`, `top`, `$top`, `limit`, `pageSize`, `skip`,
`$skip`, `page`). On a trip this busy, anything logged early is unreachable - which is how the
`FlightPricingV3` trace was ruled out as an oracle here, before it turned out not to be written in
this flow at all.
