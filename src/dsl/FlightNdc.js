require("module-alias/register");
const { getPageObject } = require("@utils/pageObjectCache");
const FlightNdcPage = require("../pages/FlightNdcPage");
const logger = require("@utils/logger").child("FlightNdc");

const FlightNdc = {
  async verifyAllResultsHaveNdcLabel(page) {
    const ndcPage = getPageObject(page, FlightNdcPage);
    const total = await ndcPage.getResultCardCount();
    const withLabel = await ndcPage.getResultsWithNdcLabelCount();
    logger.info("Verifying all results have NDC label", { total, withLabel });
    if (total === 0) throw new Error("[FlightNdc] No flight result cards found");
    if (withLabel !== total) {
      throw new Error(
        `[FlightNdc] Expected all ${total} result(s) to have NDC label, but only ${withLabel} did`
      );
    }
  },

  async verifyNoResultsHaveNdcLabel(page) {
    const ndcPage = getPageObject(page, FlightNdcPage);
    const total = await ndcPage.getResultCardCount();
    const withLabel = await ndcPage.getResultsWithNdcLabelCount();
    logger.info("Verifying no results have NDC label", { total, withLabel });
    if (total === 0) throw new Error("[FlightNdc] No flight result cards found");
    if (withLabel !== 0) {
      throw new Error(
        `[FlightNdc] Expected 0 result(s) with NDC label, but found ${withLabel} out of ${total}`
      );
    }
  },

  async verifyAllPricingOptionsHaveNdcLabel(page) {
    const ndcPage = getPageObject(page, FlightNdcPage);
    const total = await ndcPage.getPricingOptionCardCount();
    const withLabel = await ndcPage.getPricingOptionsWithNdcLabelCount();
    logger.info("Verifying all pricing options have NDC label", { total, withLabel });
    if (total === 0) throw new Error("[FlightNdc] No pricing option cards found");
    if (withLabel !== total) {
      throw new Error(
        `[FlightNdc] Expected all ${total} pricing option(s) to have NDC label, but only ${withLabel} did`
      );
    }
  },

  async verifyNoPricingOptionsHaveNdcLabel(page) {
    const ndcPage = getPageObject(page, FlightNdcPage);
    const total = await ndcPage.getPricingOptionCardCount();
    const withLabel = await ndcPage.getPricingOptionsWithNdcLabelCount();
    logger.info("Verifying no pricing options have NDC label", { total, withLabel });
    if (total === 0) throw new Error("[FlightNdc] No pricing option cards found");
    if (withLabel !== 0) {
      throw new Error(
        `[FlightNdc] Expected 0 pricing option(s) with NDC label, but found ${withLabel} out of ${total}`
      );
    }
  },
};

module.exports = FlightNdc;
