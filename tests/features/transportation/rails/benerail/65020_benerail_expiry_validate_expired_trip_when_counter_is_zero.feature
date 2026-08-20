# Test Name: 65020 Benerail > expiry - validate expired trip when counter is zero
# Description:
# Status: Active
# Labels: Rail,Expiry,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-08-01T12:45:30Z
# Updated: 2026-01-21T09:49:09Z
@transportation @rails @benerail @regression
Feature: 65020 Benerail - Validate expired trip behaviour when expiry counter reaches zero
  As a corporate traveler
  I want to see the trip correctly marked as Expired when the quote timer runs out
  So that I know I need to search again for a new quote

  Scenario: Benerail trip is marked as Expired and search-again button appears after counter expires
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlabk"
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    Then the countdown clock is between 17 and 20 minutes
    When I hover the countdown clock
    # MM:SS is the live countdown, not the 20-minute TTL — it already reads 19:5x by the time the
    # clock is hovered, so the minutes are range-checked while the wording is matched verbatim.
    Then the countdown tooltip shows the message "Your session is valid for MM:SS minutes from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability." with between 19 and 20 minutes remaining
    #To be done: Observe the behaviour when 5 min left on counter, then when 5 min left, the counter change to red,
    #On the quote when the counter is zero, Then "EXPIRED" label is shown - "Search again" button is shown (Same original results) - "Delete" button is shown
  #Add another item, See that you can go to checkout with the new (non-expiry) item