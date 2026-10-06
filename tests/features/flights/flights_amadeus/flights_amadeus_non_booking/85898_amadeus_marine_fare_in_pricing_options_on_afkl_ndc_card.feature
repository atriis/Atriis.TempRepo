# Test Name: [Automated] Amadeus - Marine (SEA) fare is listed in Pricing Options on an AF/KL NDC-headed card - ADO 85678
# Status: Active
# Labels: Regression,Flights,Amadeus,AFKL,NDC,Marine Fares,Pricing Options,payload
# Owner: Yael Alef
# Created: 2026-10-05

# ADO Test Case ID: 85898
# Source: ADO Bug #85678 - [Flights][Amadeus] Marine fare indicator shown and SEA fares received, but not
#         displayed in Pricing Options
#
# Since #82800 one card can hold the AF/KL NDC fare and the Amadeus fares for the same flights. The search
# caches the card's alternatives - including the Amadeus SEA fare that lights the marine anchor - under the
# head's hash, which for an AF/KL NDC head ends in the "NDC" marker. Pricing read them under the re-priced
# Amadeus package's hash instead, missed, and listed only the live ADT fares.
# WAW-AMS on dev returns KLM cards headed by the AF/KL NDC fare with the marine anchor for this user
# (QA run 2026-10-05, trip 3915752). On dev the live SEA re-price also answers, so this scenario guards the
# visible outcome; the cache key itself is only visible in the #84228 log line.

@ado:85898 @ado:85678 @regression @flights @amadeus @afkl @ndc @marine-fares @pricing-options @payload
Feature: 85898 Amadeus - Marine fare is listed in Pricing Options on an AF/KL NDC-headed card
  As a corporate traveler entitled to a SEA (marine) agreement
  I want the marine fare flagged on a KL/AF result to be offered in Pricing Options
  So that I can book it even when the card's headline is the AF/KL NDC fare

  Scenario: Marine fare is listed in Pricing Options on a KLM card headed by the AF/KL NDC fare
    Given I am logged in as "joana@amadeusandafklm.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "WAW" to "AMS"
    Then flight results should be available
    When I filter results by "Marine fare" checkbox
    And I filter airline results by "KLM" checkbox
    Then the "Marine Fare" indicator should be visible in results
    And the "NDC Direct Rate" indicator should be visible in results

    # The card mixes sources: AF/KL NDC headline, Amadeus SEA alternative
    When I capture the "request" payload for request type "AirShoppingV01" from Storage
    And I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch9" should contain "<ptc>SEA</ptc>"

    # Before the fix only ADT fares were listed here
    When I click to open pricing options for the first NDC direct rate result
    Then the "Marine Fare" indicator should be visible in pricing options
