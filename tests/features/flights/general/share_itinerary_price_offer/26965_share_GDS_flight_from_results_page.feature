@provider:amadeus @user:user_one
Feature: Share flight price offer
  As a corporate traveler
  I want to share 2 price offers from results for different carriers for any GDS supplier
  So the price in results and in the share offer should be the same

  Scenario: User shares a price offer for selected flights
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "AMS"
    When I click on the 'Share' button
    And I select 2 options from carriers "KLM" and "Air France"
    And I click on the 'Share' button to open the share dialog
    When I scroll into offers and get prices
    Then The shared price for carrier "KLM" should match the prices from results
    Then The shared price for carrier "Air France" should match the prices from results