@ado:84949 @regression @flights @afkl @ndc @multi-city @codeshare
Feature: 84949 AFKL NDC - Multi-city codeshare leg keeps correct cabin in flight details
  As a corporate traveler
  I want the codeshare operator and the cabin class of a multi-city KLM itinerary to be displayed correctly
  So that I know who operates each leg and in which cabin I am booked

  Scenario: AFKL NDC - Multi-city codeshare leg keeps correct cabin in flight details
    Given I am logged in as "brunaafkl@afklbrunaamsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "AMS-KUL" and "KUL-SYD" departing in 40 and 45 days
    And flight results should be available
    And I filter airline results by "KLM" checkbox
    Then the "Operated by MH" text should be visible for the 1 inbound result
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I open flight details in cart
    And I wait for flight details in cart to load
    Then "KUL - SYD" has "ECONOMY" cabin class