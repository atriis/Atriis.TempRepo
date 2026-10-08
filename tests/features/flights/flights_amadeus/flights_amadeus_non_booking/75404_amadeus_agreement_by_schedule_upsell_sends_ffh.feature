# Test Name: 75404 [Hybrid] OBT - Amadeus - Agreement fare - By Schedule search - Send upsell RQ with FFH
# Status: Design
# Labels: Hybrid,Flights,Amadeus,Agreement,By Schedule,Pricing Options,Payload
# Owner: Noam Miller

# ADO Test Case ID: 75404
# Automates the test case's "Manual" half too: the logger check of the PriceUpsellWithoutPNR
# requests. Opening pricing options sends one upsell call per agreement fare type. The backend
# (AmadeusBase upsell request builder) clones the corporate one - pricingOptionKey RW - with
# pricingOptionKey FFH added, so RW goes out twice (standard + FFH) and every other call once,
# without FFH.
#
# Observed on staging, trip 3923222: RW+FFH, RW, RU, RP - four calls. The scenario asserts the
# RW/FFH rule, not the total, so adding or removing an agreement on the test corporate does not
# break it.
#
# The payload checks come before the drawer check on purpose: they are what this test case is
# about, and they hold even when the drawer shows no fares.

@ado:75404
@regression @flights @amadeus @agreement @by-schedule @pricing-options @payload
Feature: 75404 Amadeus - Agreement fare, by schedule - upsell is also requested with FFH
  As a corporate traveler with an Amadeus agreement searching by schedule
  I want the pricing options upsell for my corporate fare to ask Amadeus for the fare family hierarchy
  So that my agreement fares are offered alongside the airline's fare families

  @priority:high
  Scenario: By schedule agreement search sends the RW upsell twice, once with FFH
    Given I am logged in as "agrementUpsell@corp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "NYC" with preferred carrier "TP"
    Then flight results should be available
    When I click to open first pricing options
    And I wait until "*Fare_PriceUpsellWithoutPNR*" requests have been sent for the trip
    Then exactly 2 "*Fare_PriceUpsellWithoutPNR*" requests should contain "<pricingOptionKey>RW</pricingOptionKey>"
    And exactly 1 "*Fare_PriceUpsellWithoutPNR*" requests should contain both "<pricingOptionKey>RW</pricingOptionKey>" and "<pricingOptionKey>FFH</pricingOptionKey>"
    And exactly 1 "*Fare_PriceUpsellWithoutPNR*" requests should contain "<pricingOptionKey>FFH</pricingOptionKey>"
    And pricing options are displayed
