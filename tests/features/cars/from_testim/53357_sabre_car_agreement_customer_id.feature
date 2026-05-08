@transportation @cars @regression @provider:sabre
Feature: 53357 - Sabre car - Agreement with customer ID number

  Scenario: Car booking with agreement field populated by customer ID number
    Given I am logged in as "tree@tree" booking a new trip
    And I add myself as a traveler
    And I select rental agency "National"
    When I search for a car at "LHR"
    And I answer reference fields and proceed
    And I add the first car from results to cart
    And I fill the free text justification if out of policy
    And I accept Terms & Conditions
    And I proceed to checkout
    And I fill the checkout reference field "General Reference Questions" with "5"
    And I complete the booking
    Then the trip should show as "Confirmed"
    When I cancel the trip
    Then the trip should be successfully cancelled
