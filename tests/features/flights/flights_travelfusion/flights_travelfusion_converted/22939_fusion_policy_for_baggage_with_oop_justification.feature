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
    # TODO: implement 'I click proceed after the search modal' — see click_on_proceed_after_search() in Testim source (test 22939)
    # TODO: implement 'I add an El Al flight with 1 included bag to the cart' — see add_el_al_flight_with_1_bag() in Testim source (test 22939)
    # TODO: implement 'no OOP indication should be displayed before adding extra baggage' — see validate_there_is_no_oop_indication() in Testim source (test 22939)
    # TODO: implement 'I add extra baggage and verify OOP indication is shown' — see add_bagage_and_validate_oop() in Testim source (test 22939)
    # TODO: implement 'the justification dropdown should display options from flight and general administration' — see validate_justification() in Testim source (test 22939)
    When I fill credit card cvv if needed
    And I proceed to checkout
    # TODO: implement 'I handle the price change prompt if visible' — see Price_change_prompt() in Testim source (test 22939)
    When I complete the booking with Fusion credit card verification
    Then the out of policy indicator should be visible in cart
