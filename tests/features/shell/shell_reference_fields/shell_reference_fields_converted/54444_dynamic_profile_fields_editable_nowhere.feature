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
    # TODO: implement step - open the user profile settings
    When I open my profile settings
    # TODO: implement step - was a Testim html-attr-validation; verify the dynamic profile field is not editable in the profile
    Then the dynamic profile field is not editable in the profile
    # TODO: implement step - close the profile tab and return to the booking context
    When I close the profile tab
    # TODO: implement step - start booking a new trip
    When I start booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "SFO" to "SEA"
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: implement step - verify the "Travellers Reference Questions" section is displayed
    Then the "Travellers Reference Questions" reference section is displayed
    # TODO: implement step - verify the dynamic profile field displays the option values (not the GDS output values)
    And the dynamic profile field shows the values:
      | Alabama |
      | Colorado |
      | Louisiana |
    Then I successfully cancel the trip
