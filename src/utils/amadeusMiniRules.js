/**
 * Amadeus EDIFACT mini rules: parses a MiniRule_GetFromPricing reply and works out the change and
 * cancellation fees the cart price breakdown must show once the agency fare rules markup is added.
 *
 * Pure functions only (no page, no I/O), so the expected values can be read and reasoned about on
 * their own. The rules mirror the backend, which is the source of truth:
 *   - TMC2 Shared.Logic/Amadeus/AmadeusMiniRulesEngine.ParseMiniRules (package-level fees)
 *   - TMC2 Shared/FareRules/FareRulesManagementEngine.UpdateMiniRules / ApplyFixedAdminFee (markup)
 *   - TMC2 FlightDetailsV3Controller (fee value -> what the price breakdown renders)
 *
 * Fee values use the backend's sentinel vocabulary:
 *   > 0  an amount            -1  no charge (permitted for free)
 *    0   not specified        -2  not permitted (non-changeable / non-refundable)
 *   -3   to be confirmed (an unfiled Category 31 with no amount)
 */

const FEE_NOT_SPECIFIED = 0;
const FEE_NO_CHARGE = -1;
const FEE_NOT_ALLOWED = -2;
const FEE_TO_BE_CONFIRMED = -3;

const CHANGE_CATEGORY = "31";
const CANCEL_CATEGORY = "33";

// Before-departure qualifiers scoped to ONE fare component. BDT is the itinerary total, repeated in
// every component's group, so the backend reads it only for a group that states none of these.
const CHANGE_BEFORE_QUALIFIERS = ["BDM", "BDX", "BDF", "BDG", "BDC", "BDI", "BDU", "BDH", "BDL"];
const CANCEL_BEFORE_QUALIFIERS = ["BDM", "BDX", "BDF", "BDG"];
const ITINERARY_TOTAL_BEFORE = "BDT";
const COMPONENT_AFTER = "ADX";
const ITINERARY_TOTAL_AFTER = "ADT";

// What the price breakdown renders for each fee state (OBT flight-price-breakdown.vue, en.json).
const DISPLAY = {
  amount: "amount",
  noCharge: "No Charge",
  notAllowed: "not allowed",
  notRetrieved: "Fee could not be retrieved",
};

function blocks(xml, name) {
  // Amadeus replies use a default namespace, but tolerate a prefix in case a logger adds one.
  const block = new RegExp(`<(?:[\\w.-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}>`, "g");
  return [...String(xml).matchAll(block)].map((match) => match[1]);
}

function firstValue(xml, name) {
  const [first] = blocks(xml, name);
  return first === undefined ? undefined : first.trim();
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Reads the Category 31 (changes) and 33 (cancellation) rule groups of a MiniRule_GetFromPricing
 * reply, in document order.
 *
 * @param {string} replyXml - The logged MiniRule_GetFromPricing response (SOAP envelope or bare reply)
 * @returns {{ change: object[], cancel: object[], currency: string }} One entry per rule group:
 *   { fareComponents: string[], fareComponentKey: string, indicators: Object<string,string[]>,
 *     amounts: Object<string,{amount:number,currency:string}> } - indicators keep every occurrence
 *   (e.g. BDA: ["1"]), amounts keep the first one per qualifier.
 */
function parseMiniRuleReply(replyXml) {
  if (typeof replyXml !== "string" || !replyXml.includes("MiniRule_GetFromPricingReply")) {
    throw new Error(
      "[amadeusMiniRules.parseMiniRuleReply] The payload is not a MiniRule_GetFromPricing reply " +
        `(got ${typeof replyXml === "string" ? `${replyXml.slice(0, 120)}...` : typeof replyXml}).`,
    );
  }

  const change = [];
  const cancel = [];
  let currency = "";

  for (const group of blocks(replyXml, "mnrRulesInfoGrp")) {
    const category = firstValue(firstValue(group, "mnrCatInfo") || "", "number");
    if (category !== CHANGE_CATEGORY && category !== CANCEL_CATEGORY) {
      continue;
    }

    // mnrFCInfoGrp/refInfo/referenceDetails (type FC) name the fare components the group covers. The
    // backend keys its after-departure bookkeeping on the FIRST reference of the first mnrFCInfoGrp.
    const fareComponents = [];
    for (const fcGroup of blocks(group, "mnrFCInfoGrp")) {
      for (const reference of blocks(fcGroup, "referenceDetails")) {
        if (firstValue(reference, "type") === "FC") {
          fareComponents.push(firstValue(reference, "value"));
        }
      }
    }
    const firstReference = blocks(firstValue(group, "mnrFCInfoGrp") || "", "referenceDetails")[0];
    const fareComponentKey = firstReference ? firstValue(firstReference, "value") || "" : "";

    const indicators = {};
    for (const status of blocks(group, "statusInformation")) {
      const indicator = firstValue(status, "indicator");
      if (!indicator) continue;
      (indicators[indicator] = indicators[indicator] || []).push(firstValue(status, "action"));
    }

    const amounts = {};
    for (const detail of blocks(group, "monetaryDetails")) {
      const qualifier = firstValue(detail, "typeQualifier");
      const amount = Number.parseFloat(firstValue(detail, "amount"));
      const detailCurrency = firstValue(detail, "currency") || "";
      if (!qualifier || Number.isNaN(amount)) continue;
      if (detailCurrency) currency = detailCurrency;
      if (!(qualifier in amounts)) {
        amounts[qualifier] = { amount, currency: detailCurrency };
      }
    }

    (category === CHANGE_CATEGORY ? change : cancel).push({ fareComponents, fareComponentKey, indicators, amounts });
  }

  if (change.length === 0 && cancel.length === 0) {
    throw new Error(
      "[amadeusMiniRules.parseMiniRuleReply] The reply holds no Category 31 (changes) or 33 (cancellation) " +
        "rule group, so there is nothing to compare the price breakdown with.",
    );
  }

  return { change, cancel, currency };
}

// An indicator states "permitted" unless one of its occurrences says 0. Absent means permitted.
function permitted(group, indicator) {
  const values = group.indicators[indicator];
  return !values || values.every((value) => value !== "0");
}

function statesIndicator(group, indicator) {
  return Array.isArray(group.indicators[indicator]);
}

function beforeDepartureFee(groups, componentQualifiers) {
  let fee = 0;
  let currency = "";
  for (const group of groups) {
    const usesItineraryTotal = !componentQualifiers.some((qualifier) => qualifier in group.amounts);
    const qualifiers = usesItineraryTotal ? [ITINERARY_TOTAL_BEFORE] : componentQualifiers;
    for (const qualifier of qualifiers) {
      const entry = group.amounts[qualifier];
      if (entry && entry.amount > fee) {
        fee = entry.amount;
        currency = entry.currency;
      }
    }
  }
  return { fee, currency };
}

/**
 * After departure the backend keeps one entry per fare component that states ADX or ADT, sets the
 * lowest-numbered one (FC 1) aside when there are several, and reads the remaining components' own
 * ADX - falling back to ADT only when none of them states a positive ADX.
 */
function afterDepartureFee(groups) {
  const perComponent = new Map();
  for (const group of groups) {
    if (!(COMPONENT_AFTER in group.amounts) && !(ITINERARY_TOTAL_AFTER in group.amounts)) continue;
    if (perComponent.has(group.fareComponentKey)) continue;
    perComponent.set(group.fareComponentKey, {
      fareComponentKey: group.fareComponentKey,
      allowed: permitted(group, "ADA"),
      fee: group.amounts[COMPONENT_AFTER]?.amount ?? 0,
      currency: group.amounts[COMPONENT_AFTER]?.currency ?? "",
      itineraryTotal: group.amounts[ITINERARY_TOTAL_AFTER]?.amount ?? 0,
      itineraryTotalCurrency: group.amounts[ITINERARY_TOTAL_AFTER]?.currency ?? "",
    });
  }

  // SortedDictionary<string, ...> in the backend: ordinal key order, first key dropped.
  const keys = [...perComponent.keys()].sort();
  const consideredKeys = keys.length > 1 ? keys.slice(1) : keys;
  const considered = consideredKeys.map((key) => perComponent.get(key));

  if (considered.length === 0) {
    return { allowed: groups.every((group) => permitted(group, "ADA")), fee: 0, currency: "", consideredFareComponents: [] };
  }

  const allowedCount = considered.filter((entry) => entry.allowed).length;
  if (allowedCount === 0) {
    return { allowed: false, fee: 0, currency: "", consideredFareComponents: consideredKeys };
  }
  if (allowedCount < considered.length) {
    // Mixed permission among the remaining components: the backend leaves the fee unset.
    return { allowed: true, fee: 0, currency: "", consideredFareComponents: consideredKeys };
  }

  let best = considered.reduce((max, entry) => (entry.fee > max.fee ? entry : max), considered[0]);
  if (best.fee > 0) {
    return { allowed: true, fee: best.fee, currency: best.currency, consideredFareComponents: consideredKeys };
  }
  best = considered.reduce((max, entry) => (entry.itineraryTotal > max.itineraryTotal ? entry : max), considered[0]);
  return {
    allowed: true,
    fee: Math.max(best.itineraryTotal, 0),
    currency: best.itineraryTotal > 0 ? best.itineraryTotalCurrency : "",
    consideredFareComponents: consideredKeys,
  };
}

/**
 * The package-level fees the backend derives from the reply, BEFORE the agency markup.
 *
 * Permission indicators are read as "most restrictive wins" (a 0 in any group denies), as the manual
 * test case and the backend's per-leg LegPenalties both state. The package-level parser itself keeps
 * the LAST BDA/ADA/RVA/FFT it reads, so a reply whose groups disagree on one of them can make the
 * screen differ from this expectation - that is reported as a mismatch rather than hidden.
 *
 * @param {{change: object[], cancel: object[], currency: string}} parsed - From parseMiniRuleReply
 * @returns {{ change: {before:number, after:number, beforeCurrency:string, afterCurrency:string},
 *             cancel: {before:number, after:number, beforeCurrency:string, afterCurrency:string} }}
 */
function computeMiniRuleFees(parsed) {
  const { change, cancel, currency: defaultCurrency } = parsed;

  // --- Category 31: changes ---
  const changeFiled = change.every((group) => permitted(group, "FFT"));
  const changeBeforePermitted = change.every((group) => permitted(group, "BDA"));
  // A group that states no RVA leaves revalidation permitted, exactly as the backend defaults it.
  const revalidationPermitted = change.every((group) => !statesIndicator(group, "RVA") || permitted(group, "RVA"));
  const changeBefore = beforeDepartureFee(change, CHANGE_BEFORE_QUALIFIERS);
  const changeAfter = afterDepartureFee(change);
  const changeSentinel = (fee) => (!changeFiled && fee <= 0 ? FEE_TO_BE_CONFIRMED : FEE_NOT_ALLOWED);

  let changeBeforeFee = changeBefore.fee;
  if (!changeBeforePermitted && !revalidationPermitted) changeBeforeFee = changeSentinel(changeBeforeFee);
  else if (changeBeforeFee === 0) changeBeforeFee = FEE_NO_CHARGE;

  let changeAfterFee = changeAfter.fee;
  if (!changeAfter.allowed) changeAfterFee = changeSentinel(changeAfterFee);
  else if (changeAfterFee === 0) changeAfterFee = FEE_NO_CHARGE;

  // --- Category 33: cancellation ---
  const cancelBeforePermitted = cancel.every((group) => permitted(group, "BDA"));
  const cancelBefore = beforeDepartureFee(cancel, CANCEL_BEFORE_QUALIFIERS);
  const cancelAfter = afterDepartureFee(cancel);

  let cancelBeforeFee = cancelBefore.fee;
  if (!cancelBeforePermitted) cancelBeforeFee = FEE_NOT_ALLOWED;
  else if (cancelBeforeFee === 0) cancelBeforeFee = FEE_NO_CHARGE;

  let cancelAfterFee = cancelAfter.fee;
  if (!cancelAfter.allowed) cancelAfterFee = FEE_NOT_ALLOWED;
  else if (cancelAfterFee === 0) cancelAfterFee = FEE_NO_CHARGE;

  return {
    change: {
      before: changeBeforeFee,
      after: changeAfterFee,
      beforeCurrency: changeBefore.currency || defaultCurrency,
      afterCurrency: changeAfter.currency || defaultCurrency,
    },
    cancel: {
      before: cancelBeforeFee,
      after: cancelAfterFee,
      beforeCurrency: cancelBefore.currency || defaultCurrency,
      afterCurrency: cancelAfter.currency || defaultCurrency,
    },
  };
}

/**
 * Adds a FIXED agency fare rules markup to one fee slot (FareRulesManagementEngine.ApplyFixedAdminFee).
 * Only a real amount or "no charge" (-1) takes the markup; "not specified" (0), "not allowed" (-2) and
 * "to be confirmed" (-3) never do.
 *
 * @param {number} fee - The slot's fee before markup
 * @param {string} feeCurrency - The slot's currency
 * @param {{amount:number, currency:string, markupType:string}} markup - The agency rule for this fee
 * @returns {number} The fee after markup
 */
function applyFixedMarkup(fee, feeCurrency, markup) {
  if (!markup || !(fee > 0 || fee === FEE_NO_CHARGE)) {
    return fee;
  }
  if (!/fixed/i.test(String(markup.markupType || ""))) {
    throw new Error(
      `[amadeusMiniRules.applyFixedMarkup] Only a "Fixed Value" markup can be predicted here, got "${markup.markupType}".`,
    );
  }
  if (markup.amount > 0 && feeCurrency && markup.currency && markup.currency !== feeCurrency) {
    // The backend converts the rule currency into the slot currency at the agency's exchange rate,
    // which a UI test cannot know. Configure the markup in the mini rules' currency instead.
    throw new Error(
      `[amadeusMiniRules.applyFixedMarkup] The markup is in ${markup.currency} but the mini rule fee is in ` +
        `${feeCurrency}; the expected value would depend on the agency exchange rate. Set the markup in ${feeCurrency}.`,
    );
  }
  const base = fee === FEE_NO_CHARGE ? 0 : fee;
  const total = round2(base + markup.amount);
  return fee === FEE_NO_CHARGE && total <= 0 ? FEE_NO_CHARGE : total;
}

/**
 * Translates a fee value into what the price breakdown shows (FlightDetailsV3Controller ChargeType).
 *
 * @param {number} fee
 * @param {"change"|"cancel"} kind
 * @returns {{ state: string, amount?: number, text: string }}
 */
function describeFee(fee, kind) {
  if (fee > 0) return { state: DISPLAY.amount, amount: fee, text: fee.toFixed(2) };
  if (fee === FEE_NO_CHARGE) return { state: DISPLAY.noCharge, text: DISPLAY.noCharge };
  if (fee === FEE_NOT_ALLOWED) {
    return { state: DISPLAY.notAllowed, text: kind === "change" ? "Non-changeable" : "Non-refundable" };
  }
  // 0 (not specified) and -3 (to be confirmed) both render the "could not be retrieved" notice.
  return { state: DISPLAY.notRetrieved, text: DISPLAY.notRetrieved };
}

/**
 * Classifies one fee section of the price breakdown (e.g. "Before departure payments Change fee €160.00").
 *
 * @param {string} sectionText
 * @returns {{ state: string, amount?: number, text: string }}
 */
function readDisplayedFee(sectionText) {
  const text = String(sectionText || "").replace(/\s+/g, " ").trim();
  if (/fee could not be retrieved/i.test(text)) return { state: DISPLAY.notRetrieved, text };
  if (/no charge/i.test(text)) return { state: DISPLAY.noCharge, text };
  if (/non-changeable|non-refundable/i.test(text)) return { state: DISPLAY.notAllowed, text };

  const numbers = text.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!numbers) return { state: "unrecognised", text };
  return { state: DISPLAY.amount, amount: Number.parseFloat(numbers[numbers.length - 1].replace(/,/g, "")), text };
}

/**
 * The change and cancellation fees, before and after departure, the price breakdown must show.
 *
 * @param {string} replyXml - The MiniRule_GetFromPricing response
 * @param {{change?: object, cancel?: object}} markup - Agency fare rules markup per fee
 * @returns {{ parsed: object, fees: object, expected: object }}
 */
function expectedPriceBreakdownFees(replyXml, markup = {}) {
  const parsed = parseMiniRuleReply(replyXml);
  const fees = computeMiniRuleFees(parsed);

  const withMarkup = {
    change: {
      before: applyFixedMarkup(fees.change.before, fees.change.beforeCurrency, markup.change),
      after: applyFixedMarkup(fees.change.after, fees.change.afterCurrency, markup.change),
    },
    cancel: {
      before: applyFixedMarkup(fees.cancel.before, fees.cancel.beforeCurrency, markup.cancel),
      after: applyFixedMarkup(fees.cancel.after, fees.cancel.afterCurrency, markup.cancel),
    },
  };

  const expected = {
    change: { before: describeFee(withMarkup.change.before, "change"), after: describeFee(withMarkup.change.after, "change") },
    cancel: { before: describeFee(withMarkup.cancel.before, "cancel"), after: describeFee(withMarkup.cancel.after, "cancel") },
  };

  return { parsed, fees, withMarkup, expected };
}

/**
 * The fare components a MiniRule_GetFromPricing reply prices, as "ORIGIN-DESTINATION" in document
 * order (fareComponentInfo/originAndDestination). Amadeus names a city here, not an airport: a
 * Frankfurt - New York JFK fare component reads "FRA-NYC".
 *
 * @param {string} replyXml - The logged MiniRule_GetFromPricing response
 * @returns {string[]} e.g. ["FRA-NYC"]
 */
function miniRuleReplyRoutes(replyXml) {
  const routes = [];
  for (const component of blocks(replyXml, "fareComponentInfo")) {
    const originAndDestination = firstValue(component, "originAndDestination");
    if (originAndDestination === undefined) continue;
    routes.push(`${firstValue(originAndDestination, "origin") || "?"}-${firstValue(originAndDestination, "destination") || "?"}`);
  }
  return routes;
}

/**
 * One line per rule group with the values a tester reads in the logger (BDX/ADX/BDA/ADA per FC).
 *
 * @param {{change: object[], cancel: object[]}} parsed
 * @returns {string[]}
 */
function summariseMiniRuleGroups(parsed) {
  const line = (category, group) => {
    const indicator = (name) => (group.indicators[name] || ["-"]).join("/");
    const amount = (name) => (group.amounts[name] ? `${group.amounts[name].amount}${group.amounts[name].currency}` : "-");
    return (
      `Cat ${category} FC ${group.fareComponents.join("+") || "?"}: ` +
      `BDA=${indicator("BDA")} ADA=${indicator("ADA")} RVA=${indicator("RVA")} FFT=${indicator("FFT")} ` +
      `BDX=${amount("BDX")} BDT=${amount("BDT")} ADX=${amount("ADX")} ADT=${amount("ADT")}`
    );
  };
  return [...parsed.change.map((group) => line(CHANGE_CATEGORY, group)), ...parsed.cancel.map((group) => line(CANCEL_CATEGORY, group))];
}

module.exports = {
  FEE_NOT_SPECIFIED,
  FEE_NO_CHARGE,
  FEE_NOT_ALLOWED,
  FEE_TO_BE_CONFIRMED,
  parseMiniRuleReply,
  computeMiniRuleFees,
  applyFixedMarkup,
  describeFee,
  readDisplayedFee,
  expectedPriceBreakdownFees,
  miniRuleReplyRoutes,
  summariseMiniRuleGroups,
};
