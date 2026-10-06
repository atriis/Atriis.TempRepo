# Test Name: 85892 Galileo NDC - TAP - Display correct supplier error when traveler name more than 60 characters
# ADO Test Case ID: 85892
# ADO workitem ID: 85392 (User Story)
#
# Story edge case: the supplier counts the date of birth toward the passenger-name length limit,
# so a long name that looks short enough on its own is rejected when the order is created. The
# test pins what the user sees: the booking error modal with the supplier's message.
# No cancel step - the hold is rejected, so there is nothing on hold to cancel.
@ado:85392 @tc:85892 @regression @flights @galileo @ndc @provider:travelport_ndc @hold @new_flight_flow @round_trip @priority:high
Feature: 85892 Galileo NDC - TAP - Display correct supplier error when traveler name more than 60 characters

  Scenario: TAP round trip hold for a long-named traveler shows the passenger name length error
    Given I am logged in as "tapCorp@tvpNdc.gdg" booking a new trip
    And I have added traveler by name "Ana Beatriz De Oliveira"
    When I search for a round trip flight from "LIS" to "LON"
    And flight results should be available
    And I filter results by carrier "Tap Air Portugal"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound brand card named "PLUS" from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    # Picking PLUS outbound leaves PLUS as the only return brand, so the first inbound card is PLUS.
    When I select the inbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click hold flight button
    Then a booking error message containing "PASSENGER NAME LENGTH MUST BE BETWEEN 3 AND 55 CHARACTERS" should be displayed
