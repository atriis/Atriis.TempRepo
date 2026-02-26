# Test Name: HYBRID for 49893 Voucher in travel plan is Ratehawk voucher, not Atriis generated one
# Description: 
# Status: Active
# Labels: Ratehawk Regression,Hotel,No Amadeus Hotel Book,Full Purchase,hybrid,Email,Share Itinerary,Voucher,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-10-22T12:36:43Z
# Updated: 2025-07-10T04:11:35Z

@regression @provider:ratehawk
Feature: 49893 Ratehawk - Travel plan email contains Ratehawk voucher, not Atriis-generated voucher
  As a corporate traveler using Ratehawk
  I want the shared itinerary email to include the Ratehawk-provided voucher
  So that travelers receive the authentic supplier voucher, not a platform-generated substitute

  @priority:high
  Scenario: Ratehawk voucher is included in the travel plan itinerary email
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the download voucher button should be visible in the trip overview" that calls DSL verifyVoucherDownloadVisible in Trip.js
    When I click the share itinerary button
    And I send the share
    # TODO: Create step "Then the travel plan email should contain the Ratehawk voucher URL, not an Atriis-generated voucher" - hybrid: validate via email/API log that voucher link is from Ratehawk

