# Test Name: 74842 [ManualQuote][Ground] - Manual quote new format
# Status: Active
# Labels: Manual Quote,Transportation,Ground Transport,Cart,Share Quote
# Owner: Pedro Carneiro
# ADO: 74842 (related feature 73564 - manual quote fields on the ground transport quote card)
@regression @manual_quote @transportation @groundtransport
Feature: 74842 [ManualQuote][Ground] - Manual quote new format
  As a corporate booker raising a ground transport manual quote
  I want the flight number, comment and passenger phone to be optional and to reach the share-quote email
  So that the extra pick-up detail travels with the quote without cluttering the cart card

  @priority:high
  Scenario: Optional new-format fields reach the share-quote email but not the cart card, and the selected form of payment is kept
    Given I am logged in as "pmac@corp.am" booking a new trip
    # Every assertion below matches English copy ("Flight number", "Pre paid", "Prepaid"), but the
    # display language is persisted on the user profile — a run left this account in German and the
    # whole scenario failed on a form that had rendered perfectly. Reset the baseline here, while
    # the trip is still empty: the switch reloads the app, and a reload after the traveller is
    # added would drop them.
    And I switch the application language to "English (UK)"
    And I have added myself as the traveler

    When I open the ground transport manual quote form
    Then the ground transport manual quote form should show "Flight number" as an optional field
    And the ground transport manual quote form should show "Comment" as an optional field
    And the ground transport manual quote form should show "Passenger phone" as an optional field
    And the ground transport manual quote form of payment should be "Pre paid"

    When I fill the ground transport manual quote from "London Heathrow Airport" to "Emirates Stadium"
    And I fill the ground transport manual quote flight number "BA1442", comment "Meet the traveller at arrivals" and passenger phone "12125550123"
    And I add the ground transport manual quote
    Then the booking status should be "On hold"
    And the ground transport quote 1 in the cart should not show the flight number, comment or passenger phone
    And the ground transport quote 1 in the cart should show the form of payment "Pre paid"

    When I click the share quote button
    Then I wait to see "Subject" field in share dialog
    When I switch the share email preview to detailed view
    Then the share quote preview should show "BA1442"
    And the share quote preview should show "Meet the traveller at arrivals"
    And the share quote preview should show "5550123"
    And the share quote preview should show "Prepaid"
    When I close the share dialog

    When I navigate to the manual quote search page from the cart
    And I open the ground transport manual quote form
    And I fill the ground transport manual quote from "London Heathrow Airport" to "Emirates Stadium"
    And I select the ground transport manual quote form of payment "Pay on departure"
    And I add the ground transport manual quote
    Then the ground transport quote 2 in the cart should not show the flight number, comment or passenger phone
    And the ground transport quote 2 in the cart should show the form of payment "Pay On Departure"
