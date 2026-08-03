# Test Name: 82128 Expedia - shared bathroom appears in the terms and conditions
# Status: Design
# Labels: Expedia,Hotel,Terms and Conditions,Cancellation Policy,Regression

@regression @provider:expedia
Feature: 82128 Expedia - Shared bathroom notice appears in the terms and conditions
  As a corporate traveler booking an Expedia hotel with a shared bathroom
  I want the shared bathroom notice shown in the terms and conditions at room level and in the cart
  So that I know the room shares a bathroom before I book it

  @priority:medium
  Scenario: Shared bathroom notice appears in room level and cart terms and conditions
    Given I am logged in as "expedia@only.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Gwesty Guest House" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    Then the room level terms and conditions should include "shared bathroom this room includes access to a shared bathroom"
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    Then the cart terms and conditions should include "shared bathroom this room includes access to a shared bathroom"
