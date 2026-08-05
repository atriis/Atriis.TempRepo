# Test Name: 61651 Sabre - Hotel - Property address is not being shorted
# Description: 
# Status: Active
# Labels: Sabre,Hotel,Regression,Share Itinerary,share quote,price offer,address,more details,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-06T12:58:29Z
# Updated: 2025-05-06T01:36:38Z

@regression @provider:sabre
Feature: 61651 Sabre - Hotel address not shortened in More Details, Itinerary, and Price Offer
  As a corporate traveler using Sabre
  I want the full hotel address to appear across More Details, Itinerary, and Price Offer pages
  So that travelers always have the complete address of their hotel

  @priority:medium
  Scenario: Full hotel address displayed in More Details, Itinerary, and Price Offer
    Given I am logged in as "shani@sabnat.com" booking a new trip
    And I click proceed button if visible
    And I have added myself as the traveler
    When I search for a hotel in "Paris France" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel address in more details should contain "US"
    When I click the share itinerary button
    Then the hotel address in the share preview should contain "US"
    When I close the share dialog
    When I click the share quote button
    Then the hotel address in the share preview should contain "US"

