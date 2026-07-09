# ADO Work Item: 78353
# ADO Test Case ID: 80775
@ado:80775
@flights @booking
Feature: 78353 Multi pax with FQTV - Display FQTV for all pax in trip and email

  As a booker
  I want to share the itinerary after booking multiple travelers
  So that the frequent flyer numbers for all travelers are visible in the travel plan preview

  Scenario: Frequent flyer numbers for all travelers appear in the shared travel plan preview
    Given I am logged in as "aafqtv1@aa.test" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Exe Mobiletest"
    And I have added traveler by name "Elizabeth Ng"
    When I search for a one way flight from "LAX" to "JFK"
    And I add the first flight to cart
    And I proceed to checkout
    When I complete the booking
    Then the last quote status should be "Ticketing Complete"
    When I click the share itinerary button
    Then the frequent flyer numbers for all travelers appear in the travel plan preview
    When I close the share dialog
    And I attempt to cancel the trip safely
