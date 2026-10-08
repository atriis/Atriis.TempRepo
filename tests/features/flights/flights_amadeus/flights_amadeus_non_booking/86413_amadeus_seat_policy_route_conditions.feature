# Test Name: 86413 Amadeus - Travel Policy - A chargeable seat on a route the seat rule excludes is not out of policy
# Status: Active
# Labels: Regression,Flights,Amadeus,Travel Policy,Seats,OOP,Bug 86266
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86413
# ADO workitem ID: 86266
#
# The seat map used to apply only the Seat Reservation Fare condition of a seat rule and ignore its
# Origin/Destination conditions, so every chargeable seat became out of policy on routes the rule excludes.
# tsach@secondclub.com has the seat rule "Seat Reservation Fare is greater than or equals 1 USD and Origin is
# not Perth", so a chargeable seat on a flight from Perth must not put the trip out of policy.
# On dev, PER-SYD returns only Jetstar (no seat map) and Qantas, so the result is filtered to Qantas.
@ado:86413 @regression @flights @amadeus @travel_policy @seats @provider:amadeus
Feature: 86413 Amadeus - A chargeable seat on a route the seat rule excludes is not out of policy
  As a corporate traveler
  I want a seat rule's route conditions to decide whether my seat is out of policy
  So that I am not asked to justify a seat on a route my policy allows (bug 86266)

  Scenario: Adding a chargeable seat on PER-SYD does not put the trip out of policy
    Given I am logged in as "tsach@secondclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PER" to "SYD"
    And flight results should be available
    And I filter airline results by "Qantas" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    Then the out of policy indicator should not be visible in cart
