# Test Name: 20182 Book hotel without sets payment in user settings
# Description: 
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-09T04:23:36Z
# Updated: 2026-01-26T02:42:08Z

@regression @provider:general
Feature: 20182 General - Book hotel with no FOP and add credit card in cart
  As a corporate traveler with no pre-configured payment method
  I want to add a credit card in the cart and complete a hotel booking
  So that I can book hotels with my own payment method

  @priority:critical
  Scenario: Book hotel, add credit card in cart, confirm and cancel
    Given I am logged in as "rebecamendes@hotelnofop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    When I add a credit card as payment method
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip with 60 seconds wait
