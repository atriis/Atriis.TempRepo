# Test Name: HYBRID for 68132 Galileo - Flight - Change fee and cancellation fee are correct when sharing quote from results page
# Status: Active
# Labels: Regression,Fare Rules,Galileo,Flights,mini rule,share quote,price offer,hybrid,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-26T01:08:27Z
# Updated: 2025-09-26T02:45:54Z

# ADO Test Case ID: 68132
# Automates the test case's "Manual" half too: the logger check that the change and cancellation
# fees in the price offer match LowFareSearchRsp. Each shared offer is paired with its
# AirPricingSolution by the flights it lists (and its total), and every departure window is
# compared - the fee terms are derived the way the search engine derives them (CancelPenalty and
# ChangePenalty by PenaltyApplies, 100% = not allowed, 0% = no charge, an amount as published, and
# the FareRulesFilter NonRefundable fallback).
#
# Observed on staging, trip 3925047: KL962 and KL964, both CancelPenalty 100% with no
# ChangePenalty - "Cancellation Anytime Non-Refundable", "Changes Anytime Non-Changeable".

@ado:68132
@regression @provider:galileo @flights @fare_rules @share_quote @hybrid @payload @priority:high
Feature: 68132 Galileo - Change fee and cancellation fee correct in shared quote

  As a corporate traveler
  I want change and cancellation fees to be correct when sharing quotes from results
  So that shared quotes contain accurate fare rule information

  Scenario: Shared quote from results page shows correct change and cancellation fees
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MME" to "AMS"
    And flight results should be available
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the 2 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Subject" field in share dialog
    And "Cancellation" should be displayed for the first quote in the share email preview
    And "Cancellation" should be displayed for the second quote in the share email preview
    And the change and cancellation fees of the 2 shared quotes should match the Galileo "LowFareSearchRsp" response
    And I close the share dialog
