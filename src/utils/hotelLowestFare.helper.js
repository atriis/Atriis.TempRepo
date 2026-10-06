const { normalizeText } = require("@utils/text");

// The same radius the application's own distance code uses (equatorial, in metres), so the
// distances computed here land on the same side of a limit as the policy's.
const EARTH_RADIUS_METRES = 6378137;

// Result cards round prices to whole numbers, so a displayed price stands for any real price
// within half a unit of it. A card that close to the out of policy price cannot show which side
// of it the real price is on.
const DISPLAY_ROUNDING = 0.5;

/**
 * Great-circle distance between two points, in kilometres, unrounded.
 *
 * The policy computes its dynamic fare on the EXACT distance, while the payload's
 * distanceFromLoc is rounded to one decimal — so a hotel 1.13 km away is "1.1" in the payload
 * yet outside a 1.1 km policy radius. Filtering on the rounded value pulls such hotels into the
 * average and shifts the out of policy price away from the one the application applies.
 *
 * @returns {number} Distance in kilometres
 */
function exactDistanceKm(lat1, lng1, lat2, lng2) {
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;

  return (EARTH_RADIUS_METRES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
}

/**
 * Reads a {lat, lng} pair, or null when either coordinate is missing. Hotel coordinates arrive
 * as strings and the search's as numbers, so both are read as numbers here.
 */
function readCoordinates(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  return { lat, lng };
}

/**
 * Calculates the hotel dynamic lowest fare: the average displayed price of the hotels a
 * search returned within a star band and a radius of the searched location.
 *
 * - Stars are floored, so a half star counts as the star below it (4.5 is a 4-star hotel).
 * - A hotel with no star rating, no coordinates or no price cannot be shown to meet the
 *   conditions, so it is left out rather than assumed to.
 * - displayPrice is the price converted into the display currency, the one the cards show.
 *
 * @param {object} searchRequest - The JSON body posted to the hotel search (carries loc.lat/lng)
 * @param {object} searchResponse - The hotel search response (carries hotels[])
 * @param {{minStars: number, maxStars: number, maxDistanceKm: number}} conditions
 * @returns {{average: number, currency: string, hotelsCounted: number, hotelsReturned: number}}
 */
function calculateDynamicLowestFare(searchRequest, searchResponse, { minStars, maxStars, maxDistanceKm }) {
  if (!Number.isInteger(minStars) || !Number.isInteger(maxStars) || minStars < 1 || maxStars > 5 || minStars > maxStars) {
    throw new Error(`The star band must be within 1-5 and not inverted, got: ${minStars}-${maxStars}`);
  }
  if (typeof maxDistanceKm !== "number" || Number.isNaN(maxDistanceKm) || maxDistanceKm < 0) {
    throw new Error(`maxDistanceKm must be a non-negative number, got: ${maxDistanceKm}`);
  }

  const reference = readCoordinates(searchRequest?.loc);
  if (!reference) {
    throw new Error("The hotel search request carries no location coordinates to measure distances from");
  }

  const hotels = searchResponse?.hotels;
  if (!Array.isArray(hotels) || hotels.length === 0) {
    throw new Error("The hotel search response returned no hotels");
  }

  const counted = hotels.filter((hotel) => {
    if (hotel.stars === null || hotel.stars === undefined) return false;
    const stars = Math.floor(Number(hotel.stars));
    if (!(stars >= minStars && stars <= maxStars)) return false;

    const coordinates = readCoordinates(hotel.loc);
    if (!coordinates) return false;
    const distance = exactDistanceKm(reference.lat, reference.lng, coordinates.lat, coordinates.lng);

    return distance <= maxDistanceKm && Number(hotel.displayPrice) > 0;
  });

  if (counted.length === 0) {
    throw new Error(
      `No hotel of ${minStars}-${maxStars} stars within ${maxDistanceKm} km was returned, so there is no dynamic lowest fare`,
    );
  }

  const currencies = [...new Set(counted.map((hotel) => hotel.displayCurrency))];
  if (currencies.length !== 1) {
    throw new Error(`The hotels counted are priced in more than one currency: ${currencies.join(", ")}`);
  }

  const total = counted.reduce((sum, hotel) => sum + Number(hotel.displayPrice), 0);

  return {
    average: total / counted.length,
    currency: currencies[0],
    hotelsCounted: counted.length,
    hotelsReturned: hotels.length,
  };
}

/**
 * Builds the policy violation text the out of policy tooltip shows for a lowest fare margin.
 *
 * @param {{margin: number, currency: string}} lowestFare
 * @returns {string}
 */
function buildLowestFareViolationText(lowestFare) {
  return normalizeText(`Hotel lowest fare is greater than or equals ${lowestFare.margin} ${lowestFare.currency}`);
}

/**
 * Which side of the out of policy price a displayed price is on. Null when it is within rounding
 * of it, because the card cannot show which side of it the real price is on.
 *
 * @param {number} price - A price as a card displays it
 * @param {number} oopPrice - The price from which a result is out of policy
 * @returns {"below"|"atOrAbove"|null}
 */
function sideOfOopPrice(price, oopPrice) {
  if (price + DISPLAY_ROUNDING <= oopPrice) return "below";
  if (price - DISPLAY_ROUNDING >= oopPrice) return "atOrAbove";
  return null;
}

/**
 * Picks the results priced closest to the out of policy price on each side of it: the most
 * expensive one below it and the cheapest one at or above it. Either is null when no result is
 * clearly on that side.
 *
 * @param {Array<{price: number}>} entries - Priced results
 * @param {number} oopPrice - The price from which a result is out of policy
 * @returns {{below: object|null, atOrAbove: object|null}}
 */
function findClosestToOopPrice(entries, oopPrice) {
  if (!Array.isArray(entries)) {
    throw new Error(`entries must be an array, got: ${typeof entries}`);
  }
  if (typeof oopPrice !== "number" || Number.isNaN(oopPrice)) {
    throw new Error(`oopPrice must be a number, got: ${oopPrice}`);
  }

  let below = null;
  let atOrAbove = null;
  for (const entry of entries) {
    const side = sideOfOopPrice(entry.price, oopPrice);
    if (side === "below" && (!below || entry.price > below.price)) below = entry;
    if (side === "atOrAbove" && (!atOrAbove || entry.price < atOrAbove.price)) atOrAbove = entry;
  }

  return { below, atOrAbove };
}

/**
 * Splits priced results into the ones that contradict the out of policy price.
 *
 * A result priced at or above the out of policy price must carry the indicator, and one priced
 * below it must not. Results within rounding of the out of policy price are counted but never
 * reported, because the card cannot show which side of it they are on.
 *
 * @param {Array<{price: number, isOutOfPolicy: boolean}>} entries - Priced results in display order
 * @param {number} oopPrice - The price from which a result is out of policy
 * @returns {{total: number, atOrAboveOopPrice: number, belowOopPrice: number, withinRounding: number,
 *            missingIndicator: Array<object>, unexpectedIndicator: Array<object>}}
 */
function splitByOopPrice(entries, oopPrice) {
  if (!Array.isArray(entries)) {
    throw new Error(`entries must be an array, got: ${typeof entries}`);
  }
  if (typeof oopPrice !== "number" || Number.isNaN(oopPrice)) {
    throw new Error(`oopPrice must be a number, got: ${oopPrice}`);
  }

  const atOrAbove = entries.filter((entry) => sideOfOopPrice(entry.price, oopPrice) === "atOrAbove");
  const below = entries.filter((entry) => sideOfOopPrice(entry.price, oopPrice) === "below");

  return {
    total: entries.length,
    atOrAboveOopPrice: atOrAbove.length,
    belowOopPrice: below.length,
    withinRounding: entries.length - atOrAbove.length - below.length,
    missingIndicator: atOrAbove.filter((entry) => !entry.isOutOfPolicy),
    unexpectedIndicator: below.filter((entry) => entry.isOutOfPolicy),
  };
}

// The results page filters hotel names with the search text as an unescaped regular expression,
// so a name holding one of these characters would not find itself.
const REGEX_SPECIAL_CHARACTERS = /[\\^$*+?()[\]{}|]/;

/**
 * Finds the hotels of a search priced closest to the out of policy price on each side of it, at
 * the price their cards display. Only hotels the hotel name filter can bring up are considered:
 * a name shared with another hotel, or holding a regular expression character, is skipped.
 *
 * @param {object} searchResponse - The hotel search response (carries hotels[])
 * @param {number} oopPrice - The price from which a hotel is out of policy
 * @returns {{inPolicyHotel: {name: string, price: number}, outOfPolicyHotel: {name: string, price: number}}}
 */
function findHotelsClosestToOopPrice(searchResponse, oopPrice) {
  const hotels = Array.isArray(searchResponse?.hotels) ? searchResponse.hotels : [];
  const nameCounts = new Map();
  hotels.forEach((hotel) => nameCounts.set(hotel.name, (nameCounts.get(hotel.name) ?? 0) + 1));

  const entries = hotels
    .filter((hotel) =>
      typeof hotel.name === "string" &&
      hotel.name.trim() !== "" &&
      nameCounts.get(hotel.name) === 1 &&
      !REGEX_SPECIAL_CHARACTERS.test(hotel.name) &&
      Number(hotel.displayPrice) > 0)
    // Cards show the price rounded to a whole number.
    .map((hotel) => ({ name: hotel.name.trim(), price: Math.round(Number(hotel.displayPrice)) }));

  const { below, atOrAbove } = findClosestToOopPrice(entries, oopPrice);
  if (!below || !atOrAbove) {
    throw new Error(
      `The search returned no hotel clearly ${below ? "at or above" : "below"} the out of policy price of ${oopPrice}`,
    );
  }

  return { inPolicyHotel: below, outOfPolicyHotel: atOrAbove };
}

module.exports = {
  exactDistanceKm,
  calculateDynamicLowestFare,
  buildLowestFareViolationText,
  splitByOopPrice,
  findClosestToOopPrice,
  findHotelsClosestToOopPrice,
};
