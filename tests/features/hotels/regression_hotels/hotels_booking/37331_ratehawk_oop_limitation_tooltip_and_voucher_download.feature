# Test Name: 37331 [Merge] Ratehawk - OOP hotel limitation works as expected and voucher is displayed only after booking
# Description: 
# Status: Active
# Labels: Ratehawk Regression,Hotel,Full Purchase,hotel limitations,Travel policy,merge,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-07T07:18:06Z
# Updated: 2025-03-17T11:03:41Z

@regression @provider:ratehawk
Feature: 37331 Ratehawk - OOP limitation tooltip and voucher download
  As a corporate traveler using Ratehawk with out-of-policy restrictions
  I want to see the OOP limitation tooltip and download a voucher after booking
  So that I understand policy constraints and have proof of my booking

  @priority:high
  Scenario: OOP limitation tooltip is displayed and voucher can be downloaded after booking
    Given I am logged in as "lidi" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "123 Champs-Élysées" for 1 night
    And I wait to see view rates text in results page
    Then the out of policy indicator should be visible in results
    Then the out of policy tooltip in results should be "Limitation  testim - do not touch is violated  130 USD in Paris,France,(PAR)"
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill in the OOP justification text "Test justification for OOP limitation tooltip and voucher download"
    Then the download voucher options for english and french should not be visible in cart
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then the download voucher options for english and french should be visible in cart
    Then I successfully cancel the trip