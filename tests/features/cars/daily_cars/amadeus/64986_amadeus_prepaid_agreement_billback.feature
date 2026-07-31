# Test Name: 64986 Amadeus - Cars - Enterprise - 'Pre paid' text is displayed for agreement fares when bill back enabled
# Labels: Regression, Amadeus, Cars, rental agency, Car billback, Billback, Agreement
# Owner: Bruna Santos
# Created: 2025-07-30T03:26:28Z
# Updated: 2025-09-14T01:06:45Z

@regression @cars @amadeus @agreement @billback
Feature: 64986 Amadeus - Cars - Enterprise - 'Pre paid' text is displayed for agreement fares when bill back enabled

  As a traveler with Amadeus billback agreement
  I want to see "Pre paid" text for agreement fares
  So that I understand the payment is pre-paid and billback is enabled

  @priority:high
  Scenario: Verify prepaid text for Amadeus agreement fares with billback
    Given I am logged in as "danielalmeida@carbillbackama.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP" with rental agency "Enterprise" and 1 months ahead
    Then handshake badge should be visible in car results
    And the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"
