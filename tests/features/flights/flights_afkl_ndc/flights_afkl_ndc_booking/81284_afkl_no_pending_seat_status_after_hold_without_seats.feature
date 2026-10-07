# Test Name: 72034 AFKL NDC - No pending seat status after hold without seat selection
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Seating,Extras,Hold
# Owner: Noam Miller

# ADO Test Case ID: 81284
# ADO workitem ID: 72034
@ado:81284 @regression @flights @afkl @ndc @seating @extras @hold @full-purchase
Feature: 81284 AFKL - No pending seat validation when booking without seats
  As a corporate traveler
  I want the Seating extra to not show a pending status when I never selected a seat
  So that the pending indicator reflects only genuinely pending seats

  Scenario: Held AFKL NDC trip with no seats selected shows no pending seating status
    Given I am logged in as "afklRules@ams.corp" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "PAR"
    And flight results should be available
    And I filter airline results by "KLM" checkbox
    And I select the first flight result in new flight flow
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I refresh the page
    And I click the extras arrow button
    Then the seating extras should not show a pending status
    Then I successfully cancel the trip
