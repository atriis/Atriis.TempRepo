# Test Name: 19502 MERGED custom error text should appear below the relevant dynamic profile field + Hotel supplier confirmation number should be displayed in share itinerary email
# Description: the user should see the custom error text on a dynamic field in checkout
# Status: Active
# Labels: Dynamic fields,UI,Regression,Full Purchase,Hotel,Share Itinerary,never failed,Amadeus,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-08T12:11:03Z
# Updated: 2025-09-11T12:24:29Z

@regression @shell @hotels @dynamic_fields @full-purchase
Feature: 19502 Custom error on dynamic profile field and hotel supplier confirmation number in share itinerary

  As a corporate traveler completing a hotel booking
  I want a custom validation error to appear below the relevant dynamic profile field at checkout
  And the hotel supplier confirmation number to appear in the share itinerary email
  So that I can correct invalid details and share an accurate booking confirmation

  Scenario: Custom error below the dynamic profile field and supplier confirmation number in the share itinerary
    Given I am logged in as "Ami@leshin.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "lhr" for 1 night
    And I click proceed button if visible
    And I select the first hotel result
    And I add a refundable room to my cart
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I select the first available financial reference
    And I wait for booking details in checkout
    And I fill in the "Bank account" reference field with "123456789"
    Then the custom error "max length is 8" should be displayed below the "Bank account" reference field
    When I click the submit for approval button
    When I fill in the "Bank account" reference field with "123456"
    And I send booking for approval
    Then the booking status should be "Confirmed"
    And the hotel booking should display a confirmation number
    When I extract the hotel supplier confirmation number
    And I click the share itinerary button
    Then the share itinerary email preview should contain the extracted hotel supplier confirmation number
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
