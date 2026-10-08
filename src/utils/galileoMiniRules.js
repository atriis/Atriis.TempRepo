/**
 * Galileo (Travelport uAPI, 1G) mini rules: what the cart price breakdown must show for a fare added
 * to the cart straight from the results, worked out from the search's LowFareSearchRsp.
 *
 * Mirrors the TMC2 backend:
 *   - Adding a 1G fare from the results does not re-price it. The cart mini rules are the four fees
 *     parsed at search time (UAPIGalileoMiniRulesEngine.BuildMiniRulesFromPackage), so they come from
 *     the LowFareSearchRsp, never from the AirPriceReq that add-to-cart sends for optional services.
 *   - UAPIGalileoFlightSearchEngine.SetPenaltyFromMaster reads the FIRST AirPricingInfo of the
 *     AirPricingSolution, and only its FIRST ChangePenalty and FIRST CancelPenalty:
 *       Amount "USD100.00"  -> 100 in USD (not converted); an amount of 0 means "not specified"
 *       Percentage 100      -> not allowed (non-refundable / non-changeable)
 *       Percentage 0        -> no charge
 *       any other %         -> not allowed (the backend cannot price a partial percentage)
 *     PenaltyApplies fills: Anytime or absent -> before and after; "Before Departure" -> before only;
 *     "After Departure" -> after only. A window left unfilled, or no penalty at all, is not allowed.
 *   - When the after-departure cancellation has no currency and FareRulesFilter/Refundability is
 *     NonRefundable, both cancellation windows become not allowed.
 *
 * Agency or corporate fare rules markup (FareRulesManagementEngine.UpdateMiniRules) is NOT added: the
 * test case says the change fee must equal the ChangePenalty amount, which only holds while the test
 * user's agency and corporation have no fare rules markup. A markup shows up as an amount mismatch.
 */

// Backend fee codes (FlightPricing fees / FlightDetailsV3Controller ChargeType).
const FEE_NOT_SPECIFIED = 0;
const FEE_NO_CHARGE = -1;
const FEE_NOT_ALLOWED = -2;

// What the price breakdown renders for each fee state (OBT flight-price-breakdown.vue, en.json).
const DISPLAY = {
  amount: "amount",
  noCharge: "No Charge",
  notAllowed: "not allowed",
  notRetrieved: "Fee could not be retrieved",
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Every <name ...>...</name> (or <name .../>) block, namespace prefix ignored. Not nesting-aware:
// only used on uAPI tags that never contain themselves.
function blocks(xml, name) {
  const safe = escapeRegex(name);
  const regex = new RegExp(`<(?:[\\w.-]+:)?${safe}\\b[^>]*?(?:\\/>|>[\\s\\S]*?<\\/(?:[\\w.-]+:)?${safe}>)`, "g");
  return String(xml || "").match(regex) || [];
}

function attribute(block, name) {
  const openTag = (String(block || "").match(/<[^>]*>/) || [""])[0];
  const match = openTag.match(new RegExp(`\\s${escapeRegex(name)}\\s*=\\s*"([^"]*)"`));
  return match ? match[1] : null;
}

function innerText(block, name) {
  const match = String(block || "").match(
    new RegExp(`<(?:[\\w.-]+:)?${escapeRegex(name)}\\b[^>]*>([^<]*)<\\/(?:[\\w.-]+:)?${escapeRegex(name)}>`),
  );
  return match ? match[1].trim() : null;
}

// "2026-11-22T12:25:00.000-05:00" and "2026-11-22T12:25:00" both -> "2026-11-22T12:25".
function localMinute(dateTime) {
  return String(dateTime || "").slice(0, 16);
}

/**
 * The flight segments of the selected package, from the SelectFlight request OBT sends on add to cart.
 *
 * @param {string|object} selectFlightRequest - The logged SelectFlight request (JSON text or object)
 * @returns {Array<{carrier: string, flightNumber: string, origin: string, destination: string, departure: string, bookingCode: string, isNdc: boolean}>}
 */
function selectedSegmentsFromSelectFlight(selectFlightRequest) {
  const body = typeof selectFlightRequest === "string" ? JSON.parse(selectFlightRequest) : selectFlightRequest;
  const legs = body?.FlightPackage?.Segments;
  if (!Array.isArray(legs) || legs.length === 0) {
    throw new Error("[galileoMiniRules] The SelectFlight request carries no FlightPackage.Segments.");
  }
  return legs.flatMap((leg) =>
    (leg.Flights || []).map((flight) => ({
      carrier: flight.Carrier,
      flightNumber: String(flight.FlightNumber),
      origin: flight.Origin,
      destination: flight.DestCode,
      departure: localMinute(flight.DepDate),
      bookingCode: flight.FlightClass,
      isNdc: Boolean(flight.IsNDCGDSSegment),
    })),
  );
}

function describeSegment(segment) {
  return `${segment.carrier}${segment.flightNumber} ${segment.origin}-${segment.destination} ${segment.departure} (${segment.bookingCode})`;
}

/**
 * The AirPricingSolutions of a LowFareSearchRsp that price exactly the selected segments in the
 * selected booking classes.
 *
 * @param {string} lowFareSearchRsp
 * @param {ReturnType<typeof selectedSegmentsFromSelectFlight>} selectedSegments
 * @returns {string[]} The matching AirPricingSolution blocks
 */
function findPricingSolutions(lowFareSearchRsp, selectedSegments) {
  const segmentsByKey = new Map();
  for (const segment of blocks(lowFareSearchRsp, "AirSegment")) {
    segmentsByKey.set(attribute(segment, "Key"), {
      carrier: attribute(segment, "Carrier"),
      flightNumber: attribute(segment, "FlightNumber"),
      origin: attribute(segment, "Origin"),
      destination: attribute(segment, "Destination"),
      departure: localMinute(attribute(segment, "DepartureTime")),
    });
  }

  const wanted = selectedSegments.map(describeSegment).sort().join(" | ");
  return blocks(lowFareSearchRsp, "AirPricingSolution").filter((solution) => {
    const pricingInfo = blocks(solution, "AirPricingInfo")[0];
    if (!pricingInfo) return false;
    const priced = blocks(pricingInfo, "BookingInfo").map((booking) => {
      const segment = segmentsByKey.get(attribute(booking, "SegmentRef"));
      return segment ? describeSegment({ ...segment, bookingCode: attribute(booking, "BookingCode") }) : "?";
    });
    return priced.sort().join(" | ") === wanted;
  });
}

function parsePenalty(penalty) {
  const amount = innerText(penalty, "Amount");
  if (amount) {
    const value = Number.parseFloat(amount.slice(3));
    return { fee: value > 0 ? value : FEE_NOT_SPECIFIED, currency: amount.slice(0, 3) };
  }
  const percentage = Number.parseFloat(innerText(penalty, "Percentage"));
  if (Number.isNaN(percentage)) return null;
  return { fee: percentage === 0 ? FEE_NO_CHARGE : FEE_NOT_ALLOWED, currency: null };
}

/**
 * The four mini-rule fees the backend parses from one AirPricingSolution.
 *
 * @param {string} solution - An AirPricingSolution block
 * @returns {{penalties: {change: string|null, cancel: string|null, refundability: string|null},
 *   fees: {change: {before: object, after: object}, cancel: {before: object, after: object}}}}
 */
function miniRuleFeesFromSolution(solution) {
  const pricingInfo = blocks(solution, "AirPricingInfo")[0];
  const notAllowed = () => ({ fee: FEE_NOT_ALLOWED, currency: null });
  const fees = {
    change: { before: notAllowed(), after: notAllowed() },
    cancel: { before: notAllowed(), after: notAllowed() },
  };

  const changePenalty = blocks(pricingInfo, "ChangePenalty")[0] || null;
  const cancelPenalty = blocks(pricingInfo, "CancelPenalty")[0] || null;
  for (const [kind, penalty] of [["change", changePenalty], ["cancel", cancelPenalty]]) {
    const parsed = penalty ? parsePenalty(penalty) : null;
    if (!parsed) continue;
    const applies = attribute(penalty, "PenaltyApplies");
    if (!applies || applies === "Anytime" || applies === "Before Departure") fees[kind].before = { ...parsed };
    if (!applies || applies === "Anytime" || applies === "After Departure") fees[kind].after = { ...parsed };
  }

  const refundability = attribute(blocks(pricingInfo, "Refundability")[0], "Value");
  if (!fees.cancel.after.currency && String(refundability).toLowerCase() === "nonrefundable") {
    fees.cancel.before = notAllowed();
    fees.cancel.after = notAllowed();
  }

  const compact = (block) => (block ? block.replace(/\s*xmlns(:\w+)?="[^"]*"/g, "").replace(/>\s+</g, "><") : null);
  return {
    penalties: { change: compact(changePenalty), cancel: compact(cancelPenalty), refundability },
    fees,
  };
}

/**
 * Translates a fee into what the price breakdown shows.
 *
 * @param {{fee: number, currency: string|null}} slot
 * @param {"change"|"cancel"} kind
 * @returns {{state: string, amount?: number, currency?: string|null, text: string}}
 */
function describeFee(slot, kind) {
  if (slot.fee > 0) {
    return { state: DISPLAY.amount, amount: slot.fee, currency: slot.currency, text: `${slot.currency} ${slot.fee.toFixed(2)}` };
  }
  if (slot.fee === FEE_NO_CHARGE) return { state: DISPLAY.noCharge, text: DISPLAY.noCharge };
  if (slot.fee === FEE_NOT_ALLOWED) {
    return { state: DISPLAY.notAllowed, text: kind === "change" ? "Non-changeable" : "Non-refundable" };
  }
  return { state: DISPLAY.notRetrieved, text: DISPLAY.notRetrieved };
}

/**
 * Classifies one fee section of the price breakdown (e.g. "Before departure payments Change fee $100.00").
 *
 * @param {string} sectionText
 * @returns {{state: string, amount?: number, text: string}}
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
 * What the price breakdown must show for the selected fare, from every LowFareSearchRsp of the trip.
 * Every solution that prices the selected segments in the selected classes is read; they must agree,
 * otherwise the selected fare cannot be told apart and the expectation is ambiguous.
 *
 * @param {string[]} lowFareSearchResponses - Every LowFareSearchRsp response logged for the trip
 * @param {ReturnType<typeof selectedSegmentsFromSelectFlight>} selectedSegments
 * @returns {{solutionKeys: string[], penalties: object, fees: object,
 *   expected: {change: {before: object, after: object}, cancel: {before: object, after: object}}}}
 */
function expectedPriceBreakdownFees(lowFareSearchResponses, selectedSegments) {
  const ndcSegments = selectedSegments.filter((segment) => segment.isNdc);
  if (ndcSegments.length > 0) {
    throw new Error(
      `[galileoMiniRules] The selected fare is a Travelport NDC offer (${ndcSegments.map(describeSegment).join(", ")}). ` +
      "Its mini rules come from the TVP NDC mini rules call, not from the 1G LowFareSearchRsp this check reads.",
    );
  }

  const candidates = lowFareSearchResponses.flatMap((response) =>
    findPricingSolutions(response, selectedSegments).map((solution) => ({
      key: attribute(solution, "Key"),
      ...miniRuleFeesFromSolution(solution),
    })),
  );
  if (candidates.length === 0) {
    throw new Error(
      `[galileoMiniRules] No AirPricingSolution in the ${lowFareSearchResponses.length} LowFareSearchRsp response(s) ` +
      `prices the selected segments: ${selectedSegments.map(describeSegment).join(", ")}.`,
    );
  }

  const signature = (candidate) => JSON.stringify(candidate.fees);
  const distinct = [...new Map(candidates.map((candidate) => [signature(candidate), candidate])).values()];
  if (distinct.length > 1) {
    throw new Error(
      `[galileoMiniRules] ${candidates.length} AirPricingSolutions price the selected segments with different ` +
      "penalties, so the selected fare cannot be identified:\n  " +
      distinct.map((candidate) => `${candidate.key}: ${candidate.penalties.change} ${candidate.penalties.cancel}`).join("\n  "),
    );
  }

  const { penalties, fees } = distinct[0];
  return {
    solutionKeys: candidates.map((candidate) => candidate.key),
    penalties,
    fees,
    expected: {
      change: { before: describeFee(fees.change.before, "change"), after: describeFee(fees.change.after, "change") },
      cancel: { before: describeFee(fees.cancel.before, "cancel"), after: describeFee(fees.cancel.after, "cancel") },
    },
  };
}

module.exports = {
  DISPLAY,
  selectedSegmentsFromSelectFlight,
  findPricingSolutions,
  miniRuleFeesFromSolution,
  expectedPriceBreakdownFees,
  readDisplayedFee,
};
