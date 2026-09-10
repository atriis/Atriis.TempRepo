const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingResultsPage = require("@pages/UKParkingResultsPage");
const { ResultsPage } = require("@pages/ResultsPage");
const logger = require("@utils/logger").child("UKParkingResults-DSL");

// The two service types parking-filter.vue can render, keyed by the label shown in the sidebar.
// Closed set: parking/models/consts.ts declares ukParkingServiceTypeOptions as exactly
// MeetAndGreet | ParkAndRide, and parking.service.ts's _getServiceType reads the matching
// segment flag. The value is the segment field to count per terminal.
const SERVICE_TYPE_SEGMENT_FIELD = {
  'Meet and Greet': 'meetAndGreet',
  'Park and Ride': 'parkAndRide',
};

const FILTER_SECTION_TERMINAL = 'Terminal';
const FILTER_SECTION_SERVICE_TYPE = 'Service type';

/**
 * UKParkingResults DSL
 *
 * Provides business-level methods for the UK Parking search results page.
 * All business logic for the UK Parking results/filter flow should be placed here.
 */
const UKParkingResults = {
  /**
   * Selects the first available filter option in the parking results filter sidebar.
   *
   * @param {Object} page - Playwright page instance
   * @throws {Error} If page is not provided
   */
  async selectFirstFilterOption(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    await ukParkingResultsPage.selectFirstFilterOption();
  },

  /**
   * Applies a terminal + service type filter pair that leaves the parking results empty.
   *
   * The service type is named by the caller (a closed two-value enum, always meaningful); the
   * terminal is CHOSEN from the current result set rather than hardcoded. Two things make a fixed
   * terminal unstable: app-checkbox-group.vue renders no checkbox at all for a terminal with zero
   * results (`hideIfNoresults`), and whether a given terminal happens to have no Park and Ride
   * parking is supplier inventory that changes with the search dates — which roll forward on every
   * run. Picking the terminal from the live data keeps the scenario's premise (a filter pair that
   * yields nothing) true whatever the supplier returns.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} serviceTypeLabel - Service type filter label, "Meet and Greet" or "Park and Ride"
   * @returns {Promise<{terminalLabel: string, serviceTypeLabel: string, terminalResults: number, offeredTerminals: string[]}>}
   * @throws {Error} If inputs are invalid, the store is unreachable, or no empty pair exists
   */
  async filterToTerminalWithoutServiceType(page, serviceTypeLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    const segmentField = SERVICE_TYPE_SEGMENT_FIELD[serviceTypeLabel];
    if (!segmentField) {
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] Unknown service type ` +
        `"${serviceTypeLabel}". The parking filter offers only: ` +
        `${Object.keys(SERVICE_TYPE_SEGMENT_FIELD).map((l) => `"${l}"`).join(', ')}.`
      );
    }

    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    // The terminal options that are actually clickable, straight from the sidebar.
    const offeredTerminals = await ukParkingResultsPage.getFilterSectionOptionLabels(FILTER_SECTION_TERMINAL);
    if (!offeredTerminals.length) {
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] The "${FILTER_SECTION_TERMINAL}" filter ` +
        `section rendered no options, so no terminal can be filtered on.`
      );
    }

    const storeRead = await ukParkingResultsPage.getParkingSegmentsFromStore();
    if (storeRead.error) {
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] Could not read the parking results from ` +
        `the store, so the terminal that has no "${serviceTypeLabel}" parking cannot be identified: ` +
        `${storeRead.error}`
      );
    }
    const { segments } = storeRead;
    if (!segments.length) {
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] The parking store holds no results, but ` +
        `the "${FILTER_SECTION_TERMINAL}" filter offered ${offeredTerminals.length} option(s) ` +
        `(${offeredTerminals.join(', ')}). The results page and its filter panel disagree.`
      );
    }

    // A sidebar label is either "Terminal <n>" (the ukParkingFilterOptions enum, translated) or the
    // raw terminal value, for a terminal outside that enum that filterRelevantOptions adds back from
    // the count map. Both shapes map to the same segment.terminal.
    const labelMatchesTerminal = (label, terminal) =>
      !!terminal && (label === terminal || label === `Terminal ${terminal}`);

    const tallies = offeredTerminals.map((label) => {
      const matching = segments.filter((segment) => labelMatchesTerminal(label, segment.terminal));
      return {
        label,
        total: matching.length,
        withServiceType: matching.filter((segment) => segment[segmentField]).length,
      };
    });

    const emptyPair = tallies.find((tally) => tally.total > 0 && tally.withServiceType === 0);
    if (!emptyPair) {
      const breakdown = tallies
        .map((t) => `${t.label}: ${t.total} result(s), ${t.withServiceType} "${serviceTypeLabel}"`)
        .join('; ');
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] Every terminal offered for this search ` +
        `has at least one "${serviceTypeLabel}" parking, so no terminal + "${serviceTypeLabel}" pair ` +
        `returns an empty result set and the scenario's premise cannot be set up. Breakdown — ` +
        `${breakdown}. This is supplier inventory, not a UI defect: re-running against different ` +
        `dates will usually restore an empty pair.`
      );
    }

    logger.info('Chose a filter pair that yields no parking results', {
      terminal: emptyPair.label,
      serviceType: serviceTypeLabel,
      terminalResults: emptyPair.total,
      offeredTerminals,
    });

    const terminalClick = await resultsPage.clickFilterSectionOptionByLabel(
      FILTER_SECTION_TERMINAL,
      emptyPair.label,
      { exact: true }
    );
    // app-checkbox-group.vue disables its single option when a section has only one
    // (isShowingOneDisabledSelectedOption), which leaves the terminal filter untoggleable.
    if (terminalClick.wasDisabled) {
      throw new Error(
        `[UKParkingResults.filterToTerminalWithoutServiceType] The "${emptyPair.label}" checkbox is ` +
        `disabled: it is the only terminal offered for this search, and app-checkbox-group.vue renders a ` +
        `lone option as a disabled, pre-checked one. The terminal filter cannot be applied.`
      );
    }

    await resultsPage.clickFilterSectionOptionByLabel(
      FILTER_SECTION_SERVICE_TYPE,
      serviceTypeLabel,
      { exact: true }
    );

    return {
      terminalLabel: emptyPair.label,
      serviceTypeLabel,
      terminalResults: emptyPair.total,
      offeredTerminals,
    };
  },

  /**
   * Narrows the parking results to one service type ("Park and Ride" / "Meet and Greet").
   *
   * Why this exists instead of the page-wide `ResultsPage.filterByCheckboxOption`: the parking
   * "Service type" section is built from `hideIfNoresults` + the per-option result counts
   * parking.service.ts derives from the search response, and app-checkbox-group.vue assigns its
   * option list ONCE in created() with no watcher. So the requested label is either rendered
   * immediately or never, and a hardcoded label turns a supplier inventory shift into a bare
   * "option not visible" selector timeout that no amount of waiting fixes.
   *
   * Three states, all real and all handled here:
   * - The label is offered alongside the other service type → click it, then gate on the sort
   *   bar's count so a swallowed click cannot pass.
   * - The label is the section's ONLY option → app-checkbox-group.vue renders it disabled and
   *   pre-checked (isShowingOneDisabledSelectedOption), which means every result already has this
   *   service type. The premise holds with nothing to click.
   * - The label has zero results, so it is not rendered at all → fall back to the service type the
   *   search DOES offer. Callers use this to reach a bookable parking quote, and parking-quote-card
   *   renders both extras cards (contact information + delivery/pickup) for ANY pending parking
   *   quote, so the service type does not change what the caller then asserts. The fallback is
   *   logged with the store tallies so the report says which type was booked and why.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} serviceTypeLabel - Preferred service type, "Park and Ride" or "Meet and Greet"
   * @returns {Promise<{serviceTypeLabel: string, requestedLabel: string, usedFallback: boolean,
   *   shownResults: number, offeredServiceTypes: string[], wasPreApplied: boolean}>}
   * @throws {Error} If inputs are invalid, the store is unreachable, or no service type is offered
   */
  async filterByServiceType(page, serviceTypeLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!SERVICE_TYPE_SEGMENT_FIELD[serviceTypeLabel]) {
      throw new Error(
        `[UKParkingResults.filterByServiceType] Unknown service type "${serviceTypeLabel}". ` +
        `The parking filter offers only: ` +
        `${Object.keys(SERVICE_TYPE_SEGMENT_FIELD).map((l) => `"${l}"`).join(', ')}.`
      );
    }

    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    // The labels that are actually clickable, straight from the sidebar. This throws a section-level
    // error when app-checkbox-group.vue removed the whole "Service type" group, which is a different
    // failure from a single missing option and must not be reported as one.
    const offeredServiceTypes = await ukParkingResultsPage.getFilterSectionOptionLabels(
      FILTER_SECTION_SERVICE_TYPE
    );

    const storeRead = await ukParkingResultsPage.getParkingSegmentsFromStore();
    if (storeRead.error) {
      throw new Error(
        `[UKParkingResults.filterByServiceType] Could not read the parking results from the store, so ` +
        `the expected result count for "${serviceTypeLabel}" cannot be verified: ${storeRead.error}`
      );
    }
    const { segments } = storeRead;

    const tally = (label) =>
      segments.filter((segment) => segment[SERVICE_TYPE_SEGMENT_FIELD[label]]).length;
    const breakdown = Object.keys(SERVICE_TYPE_SEGMENT_FIELD)
      .map((label) => `${label}: ${tally(label)}`)
      .join('; ');

    // Only the two enum labels can be booked through this flow; anything else the count map added
    // back (e.g. a blank service type) is not a service type the scenario can use.
    const usableOffered = offeredServiceTypes.filter((label) => SERVICE_TYPE_SEGMENT_FIELD[label]);
    if (!usableOffered.length) {
      throw new Error(
        `[UKParkingResults.filterByServiceType] The "${FILTER_SECTION_SERVICE_TYPE}" filter offers no ` +
        `usable service type for this search (rendered options: ` +
        `${offeredServiceTypes.length ? offeredServiceTypes.map((l) => `"${l}"`).join(', ') : 'none'}). ` +
        `Store breakdown of ${segments.length} result(s) — ${breakdown}.`
      );
    }

    const usedFallback = !usableOffered.includes(serviceTypeLabel);
    const chosenLabel = usedFallback ? usableOffered[0] : serviceTypeLabel;
    if (usedFallback) {
      logger.warn('Requested parking service type has no results — falling back', {
        requested: serviceTypeLabel,
        chosen: chosenLabel,
        offeredServiceTypes,
        breakdown,
      });
    }

    const expectedResults = tally(chosenLabel);
    const click = await resultsPage.clickFilterSectionOptionByLabel(
      FILTER_SECTION_SERVICE_TYPE,
      chosenLabel,
      { exact: true }
    );

    // A disabled option is the lone-option case: it is already pre-checked, so every result on
    // screen carries this service type and the count is unchanged by design.
    if (!click.wasDisabled) {
      await ukParkingResultsPage.waitForShownResultsCount(expectedResults);
    }

    logger.info('Filtered parking results by service type', {
      serviceType: chosenLabel,
      requested: serviceTypeLabel,
      usedFallback,
      shownResults: expectedResults,
      wasPreApplied: click.wasDisabled,
      offeredServiceTypes,
    });

    return {
      serviceTypeLabel: chosenLabel,
      requestedLabel: serviceTypeLabel,
      usedFallback,
      shownResults: expectedResults,
      offeredServiceTypes,
      wasPreApplied: click.wasDisabled,
    };
  },

  /**
   * Navigates back from the UK parking results page to the trip search page by clicking the
   * "Search" link in the results breadcrumb. The search form keeps the criteria that were
   * already submitted, so the caller can change the travelers and re-submit the same search.
   *
   * @param {Object} page - Playwright page instance
   * @throws {Error} If page is not provided
   */
  async navigateBackToSearchViaBreadcrumb(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    await ukParkingResultsPage.clickBreadcrumbSearchLink();

    return { navigated: true };
  },
};

module.exports = UKParkingResults;
