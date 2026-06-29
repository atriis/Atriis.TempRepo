# Test Name: 54571 eHotel - Voucher download option is displayed after booking
# Description: 
# Status: Active
# Labels: Ehotel Regression,Hotel,Voucher,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-22T08:28:38Z
# Updated: 2025-01-06T12:42:34Z

@regression @provider:ehotel
Feature: 54571 eHotel - Download hotel voucher in English and French
  As a corporate traveler with an existing confirmed eHotel booking
  I want to download the hotel voucher in different languages
  So that I have proof of booking in my preferred language

  @priority:medium
  Scenario: Download hotel voucher in English and French from confirmed booking
   Given I am logged in as "lucianagristo@ehotelclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    When I click add payment method button
    And I select card 1 and save
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then the download voucher options for english and french should be visible in cart