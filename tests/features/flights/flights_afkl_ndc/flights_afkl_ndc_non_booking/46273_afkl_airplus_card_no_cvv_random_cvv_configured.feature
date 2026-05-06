# Test Name: 46273 AFKL - AirPlus card is not asking for CVV because Generate random CVV is configured in admin
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,FOP,AirPlus,CVV
# Owner: Bruna Santos

@regression @flights @afkl @ndc @fop @airplus @cvv
Feature: 46273 AFKL - AirPlus card does not ask for CVV when random CVV is configured
  As a corporate traveler
  I want the AirPlus card to be paid by TMC without prompting for CVV
  So that the random CVV admin configuration is honored

  Scenario: AirPlus card paid by TMC does not prompt for CVV on a one way AFKL flight
    Given I am logged in as "afkl_randomcvv" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "AMS"
    And flight results should be available
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"

