# Test Name: 38628 MERGED Amadeus oop for baggage amount with no baggage included + can see CO2 emissions data + CO2 values appear even if in the administration they are inherited from the agency + contact info appears for a corporate user
# Description:
# Status: Active
# Labels: Flights,Amadeus,Travel policy,NL government,baggage,OOP,Full Purchase,Regression,contact info,CO2,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-20T11:18:46Z
# Updated: 2025-11-11T08:36:15Z

@regression @flights @amadeus @baggage @oop @co2 @contact-info @travel-policy
Feature: 38628 Amadeus - Baggage OOP + CO2 emissions + contact info
  As a corporate traveler
  I want to verify OOP for baggage, CO2 data, and contact info for corporate users
  So that all travel policy and environmental data is displayed correctly

  Scenario: Baggage OOP triggered, CO2 displayed, contact info visible for corporate user
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "lary bagto"
    When I search for a round trip flight from "TLV" to "BUD" with outbound in 60 days and return in 63 days
    And I click proceed button if visible
    Then flight results should be available
    And I filter results by carrier "EL AL"
    And the CO2 Squake tooltip should be visible in flight results
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
    And the CO2 Squake tooltip should be visible in cart
    When I click to edit the baggage extras section
    And I click number of baggage
    And I click dropdown option "CHECKED BAG 1st"
    Then the out of policy indicator should not be visible in baggage section from extras
    And I click the save button
    And I should see a success notification
    Then the out of policy indicator should not be visible in cart
    And justification entire section should not be visible in cart
    When I click to edit the baggage extras section
    And I select the "CHECKED BAG 2nd" baggage option for the "outbound" flight
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
    And I wait for booking details in checkout
    Then the booker notification phone on checkout should contain "9752514545"
    And the contact telephone on checkout should contain "972542563891"
    And the contact email on checkout should contain "Lary@bagto.com"
    And I complete the booking
    Then the out of policy indicator should be visible in cart
