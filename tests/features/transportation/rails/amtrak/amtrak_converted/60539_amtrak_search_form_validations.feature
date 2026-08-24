# Test Name: 60539 Amtrak search form validations
# Description: validate all the search params
# Status: Active
# Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T11:10:53Z
# Updated: 2025-12-23T03:42:20Z
@transportation @rails @amtrak @regression
Feature: 60539 Amtrak - Search form validations
  As a corporate traveler
  I want to validate all search parameters in the Amtrak search form
  So that I can confirm search form fields and validations work correctly

  Scenario: Amtrak search form fields and passenger validations
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas" without clicking search button
    And I validate the departure time selector in Amtrak search by changing the hour
    And I validate the return time selector in Amtrak search by changing the hour
    And I add a second traveler through the Amtrak search form
    When I type "123" in promo code field
    Then the promo code minimum length validation "Promo Code must be 4 characters" should be displayed
    When I expand the traveler detail section in Amtrak search
    And I have added a random guest traveler with name "Israel" "Israeli" in the empty traveler slot
    And I type "1234" in promo code field
    And I click the search button
    Then I wait for select text to be visible
