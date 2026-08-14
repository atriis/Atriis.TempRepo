# Test Name: 82534 AFKL - Passport is mandatory when destination is USA
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,APIS,Passport,Passenger Info,Extras,Cart
# Owner: Noam Miller

# ADO Test Case ID: 83081
# ADO workitem ID: 82534
# Bug: AFKL ticketing failed with "One of these mandatory details for secure flight is missing
# from the SSR DOCS". The fix makes the passport details in Passenger Info a hard error (not a
# warning) for AFKL, so Proceed to Checkout stays blocked until they are filled. Scope is passport
# only — Passenger Info also holds other APIS data that this test does not cover.
@ado:83081 @regression @flights @afkl @ndc @apis @passport
Feature: 83081 AFKL - Passport is mandatory when destination is USA

  As a corporate traveler
  I want passport details to be mandatory before checkout on a US-bound AFKL trip
  So that a booking cannot reach ticketing with missing passport details

  Scenario: Passport is mandatory before checkout when destination is USA
    Given I am logged in as "afklcorp@regression.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "IAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the passenger info section should be marked as required with an asterisk
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the proceed to checkout button should be disabled
    And the cart should show the in order to proceed warning
    And the passenger info section should be highlighted in red
    When I click passenger info in extras
    And I click the save button
    # Deliberately count-free: the count includes every red element in the panel (the traveller tab
    # label as well as the fields), so pinning a number breaks whenever a field is added to the
    # mandatory set. The passport fields filled below are what this test is actually about.
    Then mandatory fields should be highlighted in the passenger info section
    When I fill in the passport number "8732186" in passenger info section
    And I fill in the nationality in passenger info section with "united kingdom"
    And I fill in the applicable country in passenger info section with "afghanistan"
    And I fill in the passport expiry date in passenger info section
    And I click the save button
    Then the passenger info section should show a green circle checkmark indicating success
    And the proceed to checkout button should be enabled
    Then I successfully cancel the trip
