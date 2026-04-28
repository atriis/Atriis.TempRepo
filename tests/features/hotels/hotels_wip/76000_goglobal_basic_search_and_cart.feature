@regression @provider:goglobal
Feature: 76000 GoGlobal basic hotel flow

  Scenario: Search GoGlobal hotel and add refundable room to cart
    Given I am logged in as "ggtestim" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Paris" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
