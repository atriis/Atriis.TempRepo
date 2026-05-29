# Test Name: 53953 hotel loyalty number pre-populated according to the master chain
# Description: 
# Status: Active
# Labels: Regression,Hotel,hotel chain codes,hotel master chain,Hotel loyalty number,Cart,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-11-06T06:33:44Z
# Updated: 2025-09-14T06:51:55Z

@regression @hotel_loyalty @provider:general
Feature: 53953 Hotel loyalty number pre-populated according to the master chain
  As a corporate traveler with loyalty numbers configured per hotel chain
  I want the loyalty number to be pre-populated based on the master chain hierarchy
  So that I don't have to manually enter my loyalty number for related hotel chains

  @priority:critical
  Scenario: Loyalty number from same master chain is pre-populated (Case 1: sibling chain)
    Given I am logged in as "Terry@Chain.com" booking a new trip
    And I have added myself as the traveler
    # Search hotel in London, filter by "hilton"
    When I search for a hotel in "london,united" for 1 night(s)
    And I filter hotel results by hotel name "hilton"
    And I select the first hotel result
    And I add the first available room to my cart
    # Verify loyalty number is pre-populated from sibling chain (CN - 121212)
    Then the loyalty number should be pre-populated with a green success icon
    # TODO: New step needed — verify ".success-icon" shows "check_circle" and
    # loyalty section card-title shows "Loyalty number"
    # See case_1 function in Testim 53953
    When I expand the loyalty number extras section
    Then the loyalty chain dropdown should show "CN - 121212"
    # TODO: New step needed — verify ".el-select__placeholder span" contains "CN - 121212"
    # This confirms loyalty was taken from a chain in the same master chain
    # See case_1 function in Testim 53953
    # Cancel the quote to proceed to case 2
    Then I successfully cancel the quote
    # TODO: Verify this maps correctly — the Testim test uses Cancel_quote_from_cart_before_checkout()
    # which hovers over dropdown, clicks cancel item, confirms dialog.
    # Existing step "Then I successfully cancel the quote" may work here.

  @priority:critical
  Scenario: Loyalty number from master chain is pre-populated (Case 2: master chain directly)
    Given I am logged in as "Terry@Chain.com" booking a new trip
    And I have added myself as the traveler
    # Search hotel from cart drawer and filter by "radisson"
    When I search for a hotel in "london,united" for 1 night(s) from the cart drawer
    # TODO: Verify — the Testim test clicks ".flicking-camera > :nth-child(2) .icon-text"
    # then ".btn--size-large" to search. This is "add hotel from cart" flow.
    # Existing step "I search for a hotel in {string} for {int} night(s) from the cart drawer"
    # may handle this but needs verification.
    And I filter hotel results by hotel name "radisson"
    And I select the first hotel result
    And I add the first available room to my cart
    # Verify loyalty number is pre-populated from master chain (CW - 456456)
    Then the loyalty number should be pre-populated with a green success icon
    # TODO: Same new step as Case 1
    When I expand the loyalty number extras section
    Then the loyalty chain dropdown should show "CW - 456456"
    # TODO: New step needed — verify ".el-select__placeholder span" contains "CW - 456456"
    # This confirms loyalty was taken from the master chain
    # See case_2 function in Testim 53953
