# Test Name: 55723 expedia voucher does not include prices
# Description:
# Status: Closed (ADO reason: Obsolete) - related bug 60486 "voucher for expedia is missing" is Closed/Verified.
#         Confirm with the test owner that this scenario is still in scope before adding it to a regression suite.
# Labels: Hotel,Expedia,Full Purchase,Voucher,Deposit
# Owner: Shani Hadar
# Created: 2024-12-22T13:49:44Z
# Updated: 2026-08-18T10:01:52Z

@regression @provider:expedia
Feature: 55723 Expedia - Hotel voucher does not include prices
  As a corporate traveler with a confirmed Expedia deposit booking
  I want the downloadable hotel voucher to omit the trip prices in every language
  So that whoever receives the voucher never sees the commercial values of the booking

  @priority:medium
  Scenario: Expedia deposit hotel is booked and its voucher is available in English and French
    Given I am logged in as "edi@yahot.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Las Vegas" for 1 night
    And I wait to see view rates text in results page
    When I filter hotel results by hotel name "Trump International Hotel Las Vegas"
    And I select the first hotel result
    And I filter room results by refundable
    And deposit required is displayed in the first room
    And I add the first available room to my cart
    And the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    And I fill credit card cvv if needed
    When I click more details in cart
    And I extract the price from more details
    And I close more details in cart
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then the download voucher options for english and french should be visible in cart
    When I download the hotel voucher in "English"
    Then the downloaded hotel voucher should not contain any prices
    And the extracted price from cart more details is not displayed
    When I download the hotel voucher in "French"
    Then the downloaded hotel voucher should not contain any prices
    And the extracted price from cart more details is not displayed
    Then I successfully cancel the trip
