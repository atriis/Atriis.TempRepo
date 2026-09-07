# Test Name: Sabre NDC (BA) - CVV is mandatory when a credit card is selected as form of payment
# Status: Active
# Labels: Sabre NDC,British Airways,FOP,credit card,CVV,Flights,Regression
# Owner: Bruna Santos

@regression @flights @sabre-ndc @cvv @fop
Feature: Sabre NDC - FOP - Credit card CVV is needed
  As a corporate traveler
  I want the cart to require a CVV once I pay a British Airways Sabre NDC flight by credit card
  So that a booking can never be sent to checkout without the card security code

  Scenario: CVV is mandatory after selecting a credit card as FOP on a British Airways round trip
    Given I am logged in as "corpSabreNdc@reg.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    When I filter results by carrier "British Airways"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the card
    And I select card 2 and save
    Then the CVV field should be displayed