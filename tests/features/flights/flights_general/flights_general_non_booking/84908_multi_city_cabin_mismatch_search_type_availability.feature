# Test Name: 84908 Flights - Multi city - "Complete trip" is greyed out when the leg cabins differ
# Description: A leg added to a multi-city search inherits the previous leg's cabin. While every
#              leg shares one cabin the trip can be priced as a whole, so "Complete trip" is the
#              selected mode; once the cabins differ the trip can only be searched leg by leg, so
#              "Complete trip" is greyed out and "By schedule" takes over as the selected mode.
# Status: Draft
# Labels: Regression,UI,by schedule,Flights,multi city
# Owner: Bruna Santos

# ADO Test Case ID: 84908
@regression @flights @by_schedule @multi_city
Feature: 84908 - Multi city search type availability follows the legs cabin classes
  As a corporate traveler building a multi-city trip
  I want the "Complete trip" and "By schedule" options to enable and disable with my cabin choices
  So that I can only pick a search mode the itinerary can actually be priced in

  @priority:high
  Scenario: Matching leg cabins keep Complete trip, a cabin mismatch greys it out and forces By schedule
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I start a multi-city flight search with the first leg "LHR-BNA" and cabin class "Premium Economy"
    And I add another flight leg "MEX-LHR" to the multi-city search
    # The new leg copies the previous leg's cabin rather than resetting to Economy.
    Then the cabin class for leg 2 should be "Premium Economy"
    # Both legs share one cabin, so the trip can be priced as a whole: "Complete trip" is the
    # active mode and "By schedule" is the inactive (grey) tab beside it. Neither is disabled.
    And the search type should be "Complete trip"
    And the "Complete trip" search type should be selectable
    And the "By schedule" search type should be selectable
    When I set the cabin class for leg 2 to "Economy"
    # The legs no longer share a cabin, so the trip can only be searched leg by leg: the form
    # disables "Complete trip" outright and moves the selection to "By schedule".
    Then the "Complete trip" search type should be greyed out
    And the "By schedule" search type should be selectable
    And the search type should be "By schedule"
