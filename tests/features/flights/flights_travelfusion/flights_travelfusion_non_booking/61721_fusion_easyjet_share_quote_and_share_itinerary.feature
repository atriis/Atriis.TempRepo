# Test Name: 61721 Fusion - EasyJet - Share quote and share itinerary work as expected
# Status: Active
# Labels: Regression,Fusion,EasyJet,specific,Flights,Share Itinerary,share quote,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-08T01:30:51Z
# Updated: 2025-05-08T01:46:43Z

@regression @flights @fusion @share-itinerary @share-quote @easyjet @priority:medium
Feature: 61721 Fusion EasyJet - Share quote and share itinerary work as expected
  As a corporate traveler with a Fusion EasyJet flight in the cart
  I want to share quote and share itinerary functionality to work
  So that I can share booking information with stakeholders

  Scenario: Share itinerary and share quote work as expected from Fusion EasyJet cart
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "GLA" to "BRS"
    Then flight results should be available
    When I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click the share itinerary button
    Then I wait to see "Subject" field in share dialog
    When I close the share dialog
    When I click the share quote button
    Then I wait to see "Subject" field in share dialog
    And I close the share dialog
