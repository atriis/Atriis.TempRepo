# Test Name: 64986 Amadeus - Cars - Enterprise - 'Pre paid' text is displayed for agreement fares when bill back enabled
# Labels: Regression, Amadeus, Cars, rental agency, Car billback, Billback, Agreement
# Owner: Bruna Santos
# Created: 2025-07-30T03:26:28Z
# Updated: 2025-09-14T01:06:45Z

@regression @cars @amadeus @agreement @billback
Feature: 64986 Amadeus enterprise prepaid agreement fares with billback

  As a traveler with Amadeus billback agreement
  I want to see "Pre paid" text for agreement fares
  So that I understand the payment is pre-paid and billback is enabled

  Background:
    Given I am logged in as "danielalmeida@amadeus.car" booking a new trip
    And I have added myself as the traveler
    And I have selected Enterprise rental agency

  @priority:high
  Scenario: Verify prepaid text for Amadeus agreement fares with billback
    When I search for a car at "LHR"
    Then the agreement tooltip should display agreement text
    And the payment type should display "Pre paid" in results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And the payment type should display "Pre paid" in cart
