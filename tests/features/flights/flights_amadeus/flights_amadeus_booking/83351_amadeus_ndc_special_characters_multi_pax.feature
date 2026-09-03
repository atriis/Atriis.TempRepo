# Test Name: Amadeus NDC [OBT] - Booking successful when traveler name contains special characters, Multi pax
# ADO Bug: 73401
# ADO Test Case: 83351 (Regression 2026\16 / suite "Flights Amadeus", linked to bug 73401)
#   Do NOT link this to Test Case 83283: that one covers the same bug on GTP, which is a
#   different product front. This test is OBT only.
# Status: Active
# Domain: flights / supplier: Amadeus NDC
# Owner: Noam Miller

@ado:83351 @bug:73401 @regression @flights @amadeus @ndc @traveler-name @multi-pax @hold
Feature: 83351 Amadeus NDC - Booking succeeds for multi pax with special characters in traveler names

  As a corporate travel arranger
  I want to hold an Amadeus NDC flight for two travelers whose names contain accented characters
  So that special characters in profile traveler names do not break the booking

  Scenario: Hold a LIS to AMS Amadeus NDC flight for two randomly selected travelers with accented names
    Given I am logged in as "amaNdc@special.name" booking a new trip
    And I have added 2 random travelers from the list: Élodie Dubois-Lefèvre, Bjørn Kjærsgård, Begoña Núñez de Íñigo
    When I search for a one way flight from "LIS" to "AMS"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    And all quotes should have PNR codes
    Then I successfully cancel the trip
