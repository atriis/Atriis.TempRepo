# Test Name: 54444 - Dynamic Profile Fields - Cannot edit in profile when Editable = Nowhere, Display value from Option not from Output to GDS
# Description:
# Status: Active
# Labels: NL government,Regression,Dynamic fields,2026 plan 1
# Owner: Noam Miller
# Created: 2024-11-18T10:31:43Z
# Updated: 2025-06-24T02:41:20Z

@shell @reference_fields @dynamic_fields @regression
Feature: 54444 - Dynamic profile field is not editable when Editable = Nowhere

  As a user
  I want a dynamic profile field configured as "Editable = Nowhere" to be non-editable in my profile
  So that the field displays the option value and cannot be changed

  Scenario: Dynamic profile field is not editable in profile and displays option values at checkout
    Given I am logged in as "noedit@dynamic.nl"
    When I navigate to my user profile
    Then the dynamic profile field is not editable in the profile
    When I close tab 2
    And I book a new trip
    And I have added a random guest traveler
    And I search for a one way flight from "SFO" to "SEA"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the checkout reference field dropdown "Can Edit" contains the options:
      | Alabama |
      | Colorado |
      | Louisiana |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
