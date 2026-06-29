# Test Name: 78592 BA NDC - Hold Flight with Special Character Traveler Names
# ADO: https://dev.azure.com/atriis/Atriis/_workitems/edit/78592
# Status: Active — NOTE: This test is expected to FAIL on current dev branch (fix not yet merged)
# Domain: flights / supplier: BA NDC
# Owner: Noam Miller

# ADO Test Case ID: 80155
@ado:80155 @regression @provider:ba-ndc @ado:78592
Feature: 80155 BA NDC - Book flight with special character traveler name, Polish characters

  As a corporate traveler booking on behalf of colleagues
  I want to search for and hold a BA NDC flight from LON to WAW
  So that I can confirm the hold flow works correctly for travelers with special characters in their names

  Scenario: Hold a BA NDC LON to WAW flight for a randomly selected traveler with special character name
    Given I am logged in as "polish@name1.reg" booking a new trip
    And I have added a random traveler from the list: Łukasz Śliwiński, Błażej Ząbkowski, Ćwiątek Źródłowski, Świętosława Końska, Małgorzata Łącka
    When I search for a one way flight from "LON" to "WAW"
    Then flight results should be available
    When I filter results by carrier "BA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
