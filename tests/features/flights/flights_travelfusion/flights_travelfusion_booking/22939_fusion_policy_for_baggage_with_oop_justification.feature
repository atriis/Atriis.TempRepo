# Test Name: 22939 fusion - policy for baggage amount with baggage included + justification is taken from flight and general in the administration
# Status: Active
# Labels: Fusion,Regression,Flights,Travel policy,OOP,Full Purchase,baggage,Cart,Pricing Options,NL government,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-10-31T12:25:04Z
# Updated: 2025-09-07T08:34:58Z

@regression @flights @fusion @travel-policy @oop @baggage @full-purchase @priority:high
Feature: 22939 Fusion - Travel policy for baggage with OOP justification from flight and general admin
  As a corporate traveler booking a Fusion flight with baggage subject to travel policy
  I want adding baggage beyond the included amount to trigger an out-of-policy indication
  So that justification options from flight and general administration are presented

  Scenario: Adding extra baggage on Fusion flight triggers OOP indication and justification options
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "lary bagto"
    When I search for a round trip flight from "LON" to "OSL"
    And I click proceed button if visible
    Then flight results should be available
    When I filter results by carrier "DY"
    And I click to open first pricing options
    Then the pricing options row containing "2PC" should show the out of policy indicator
    When I select the pricing option containing "1PC"
    And I select the pricing option containing "1PC"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    And the out of policy indicator should not be visible in cart
    When I click to edit the baggage extras section
    And I add baggage for outbound and return segments
    Then the booking status should be "Pending booking"
    And the out of policy indicator should be visible in cart
    When I open the OOP justification dropdown and verify there are 13 options
    Then the OOP justification dropdown should contain the following options:
      | Business class upgrade after (written) approval employer.    |
      | Cheaper ticket only possible with adjusted travel program    |
      | Extra luggage allowed after (written) approval employer.     |
      | Flight time extends more with 4 hours if indirect.           |
      | general a                                                    |
      | general b                                                    |
      | Governmental contract fares selected                         |
      | Indirect flight only with possible with very short transfer time. |
      | No train available to destination                            |
      | Significantly lower CO2 emissions with this direct flight    |
      | Train not an option for same day return                      |
      | Train option only possible with adjusted travel program      |
      | Travel program still not definite. Flexibility needed.       |
    When I select OOP justification option "general a" from the open dropdown
    When I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking with Fusion credit card verification
    Then the out of policy indicator should be visible in cart
