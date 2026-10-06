# ADO Test Case ID: 86244
@shell @reference_fields @dynamic_fields @regression @checkout @manual_quote @cars @provider:general @priority:high @ado:86244
Feature: 86244 Dynamic Profile Fields - Booker with "Can Edit Non Editable Dynamic Profile Fields" can edit them

  As a booker with the "Can Edit Non Editable Dynamic Profile Fields" role
  I want every dynamic profile field to be editable, even ones configured as non-editable
  So that I can correct them in my profile and at checkout

  Scenario: Dynamic profile fields are editable in the profile and at checkout
    Given I am logged in as "Edible@Dynamic.com"
    When I navigate to my user profile
    Then all the dynamic profile fields should be editable in the profile
    When I close tab 2
    And I book a new trip
    And I have added myself as the traveler
    And I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    Then all the fields in the "Travellers Reference Questions" reference section should be editable
    When I navigate to cart from checkout
    Then I successfully cancel the trip
