# Test Name: 45002 Multi city - "Complete trip" and "By schedule" are working as expected
# Description:
# Status: Active
# Labels: Regression,UI,by schedule,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-23T10:24:11Z
# Updated: 2025-09-14T09:10:52Z

@regression @shell @flights @by_schedule @multi_city
Feature: 45002 - Multi city "Complete trip" and "By schedule" are working as expected
  As a corporate traveler
  I want the multi-city search to correctly switch between "Complete trip" and "By schedule" modes
  So that the search type reflects the expected mode when the segments' cabins differ or a segment is removed

  Scenario: Different cabins per segment switch to By schedule, and removing the extra segment reverts to Complete trip
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    # Both segments share one cabin, so the itinerary can still be priced as a whole.
    When I search for a multi-city flight with legs "LON-MAD" and "MAD-BKK" with cabin class "Business" without clicking search button
    Then the search type should be "Complete trip"
    # Different cabins per segment: the form moves the selection to "By schedule" on its own.
    When I set the cabin class for leg 2 to "Economy"
    Then the search type should be "By schedule"
    # Back down to a single segment, so the cabins cannot differ and "Complete trip" returns.
    When I remove the last flight leg from the multi-city search
    Then the search type should be "Complete trip"
