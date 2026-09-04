# Test Name: 29776 baggage amount - before hold - with 1 baggage included - amadeus
# Description:
# Status: Active
# Labels: Flights,Regression,Amadeus,Travel policy,NL government,baggage,OOP,Full Purchase,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-09T12:55:09Z
# Updated: 2025-12-09T08:27:59Z

@regression @flights @amadeus @baggage @oop @travel-policy
Feature: 29776 Amadeus - Baggage amount OOP with 1 baggage included
  As a corporate traveler
  I want to verify out-of-policy is triggered when adding extra baggage
  So that the travel policy for baggage is correctly enforced

  Scenario: Adding extra baggage triggers OOP and requires justification
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "lary bagto"
    When I search for a round trip flight from "TLV" to "BUD" with outbound in 60 days and return in 63 days
    And I click proceed button if visible
    Then flight results should be available
    And I filter results by carrier "EL AL"
    And I click to open first pricing options
    And I select the pricing option containing "1 PC"
    And I should see the heading "Flight To Tel Aviv"
    And I select the pricing option containing "1 PC"
    And I add to trip from pricing options
    And the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
    When I click to edit the baggage extras section
    And I click number of baggage
    And I click dropdown option "CHECKED BAG 2nd"
    Then the out of policy indicator should be visible in baggage section from extras
    And when I hovering over the out of policy indicator in baggage section from extras it should contain message "Luggage Amount is greater than or equals 2"
    And I click the save button
    And I should see a success notification
    Then the OOP policy reason should be "Luggage Amount is greater than or equals 2"
    Then "Out Of Policy*" is displayed above "Select your justification dropdown"
    Then the out of policy tooltip in cart should be "Luggage Amount is greater than or equals 2"
    When I open the OOP justification dropdown and verify there are 13 options
    And the OOP justification dropdown should contain the following options:
    | No train available to destination                       |
    | Train not an option for same day return                 |
    | Train option only possible with adjusted travel program |
    | Significantly lower CO2 emissions with this direct flight |
    | Cheaper ticket only possible with adjusted travel program |
    | Travel program still not definite. Flexibility needed. |
    | Indirect flight only with possible with very short transfer time. |
    And I select OOP justification option "No train available to destination" from the open dropdown
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the out of policy indicator should be visible in cart
