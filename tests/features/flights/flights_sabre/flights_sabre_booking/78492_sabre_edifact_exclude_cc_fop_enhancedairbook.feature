# Test Name: 78492 Sabre EDIFACT - Exclude Credit Card FOP from EnhancedAirBook When Not Allowed by Fare Rules
# Status: Design
# Labels: Regression,Flights,Sabre,GDS,EDIFACT,FOP,credit-card,branded-fares,hold,2026 plan 2
# Owner: Yael Alef

@regression @flights @sabre @hold @fop @credit-card @branded-fares @provider:sabre @priority:high
Feature: 78492 Sabre EDIFACT - Credit card FOP excluded from EnhancedAirBook when not allowed by fare rules
  As a corporate traveler
  I want to book a Sabre EDIFACT Delta flight where the fare rules do not allow credit card FOP
  So that the system correctly excludes the credit card from EnhancedAirBook while still showing it as valid in cart

  Scenario: Credit card FOP is excluded from EnhancedAirBook for a Delta branded fare that disallows it
    Given I am logged in as "guystr@gtc.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "LAX"
    And flight results should be available
    And I filter airline results by "Delta" checkbox
    When I click to open first pricing options
    Then the "Agreement" indicator should be visible in pricing options
    When I select the pricing option containing "DELTA MAIN CLASSIC"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I hold the trip
    Then I successfully cancel the trip
