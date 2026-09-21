# Source: ADO Bug #83321 - NFF Galileo Search by Schedule: Missing Fare Brands in Pricing Options
# for Multi-City Search. The cross-leg brand matrix caps itself at 64 combinations and spends that
# budget multiplicatively, so before the fix a late leg of a wide selection rendered a single card
# however many fares its ladder held.
#
# Only the first leg is judged: which fares a later leg displays is filtered by the fare already
# picked before it, and those rules are in the product's matrix rather than in any payload this suite
# reads. The cross-leg check that covers every leg is held in flights_galileo_blocked, on bug 84865.

# ADO Test Case ID: 84859
@ado:84859
@regression @flights @galileo @nff @by-schedule @multi-city @payload @priority:high
Feature: 84859 Galileo - the first leg of a multi-city selection offers every fare priced for it
  As a corporate traveler selecting a multi-city itinerary by schedule
  I want each leg to offer every fare the airline priced for it
  So that no fare brand is dropped from pricing options by how the legs combine

  Scenario: The first leg of a four-leg by-schedule selection offers every priced fare
    Given I am logged in as "corp.galileo.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city by-schedule flight with legs "JFK-LAX, LAX-DFW, DFW-ORD, ORD-JFK"
    Then flight results should be available
    # One carrier on every leg: a leg whose flight is priced on another carrier gets no ladder of
    # its own, leaving nothing to compare its cards against.
    When I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    When I capture the fare ladder priced for each leg in "AirPriceRsp" from Storage
    # Keeps the scenario in the regime the bug lives in. Below the cap the matrix truncates nothing,
    # and this would quietly become a check that no longer represents a wide selection.
    Then the fare ladder combinations should exceed 64
    And the displayed leg 1 should offer a brand card for every fare in its ladder
