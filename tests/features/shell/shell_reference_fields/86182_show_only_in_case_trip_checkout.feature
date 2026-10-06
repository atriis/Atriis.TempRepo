# ADO Test Case ID: 86182
@shell @reference_fields @regression @checkout @manual_quote @cars @provider:general @priority:high @ado:86182
Feature: 86182 Reference Fields - Show only in case at trip checkout

  As a booker checking out a trip with a BA flight and a car but no hotel
  I want reference fields configured with a "show only in case" condition to appear only when their condition is met
  So that each checkout section asks only the questions relevant to the trip's products

  Scenario: Checkout reference fields are shown only for the conditions the trip meets
    Given I am logged in as "testim@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I dismiss the mandatory notifications popup if displayed
    And I add the first car to cart
    And I navigate to the manual quote search page from the cart
    And I add a flight manual quote from "LON" to "MAD" with carrier "British Airways (BA)"
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the "General Reference Questions" reference section should show the fields:
      | Hotel missing |
    And the "Travellers Reference Questions" reference section should show the fields:
      | BA Flight       |
      | Not LY flight   |
      | No Ofran Vendor |
    And the "Travellers Reference Questions" reference section should not show the fields:
      | Car missing |
    When I navigate to cart from checkout
    Then I successfully cancel the trip
