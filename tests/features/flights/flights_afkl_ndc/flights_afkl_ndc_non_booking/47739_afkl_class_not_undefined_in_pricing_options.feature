# Test Name: 47739 AFKL - Class is not appearing as undefined in pricing options
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Pricing Options,Cabin Class
# Owner: Bruna Santos

@regression @flights @afkl @ndc @pricing-options
Feature: 47739 AFKL - Cabin class is correctly displayed in pricing options
  As a corporate traveler
  I want to see the cabin class in the pricing options drawer
  So that the class is never displayed as undefined

  Scenario: Business class is displayed in pricing options for an AFKL round trip
    Given I am logged in as "bsafkl@bsafkl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "AMS" to "HKG"
    And flight results should be available
    And I filter results by carrier "kl"
    And I click to open first pricing options
    Then the cabin class displayed in pricing options should be "Business"
