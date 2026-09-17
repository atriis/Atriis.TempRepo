# Test Name: 57338 Galileo - Hotel - "Filter non agreement GDS hotels" works as expected
# Description: 
# Status: Active
# Labels: Galileo,Hotel,Regression,Agreement,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-27T02:09:07Z
# Updated: 2025-07-21T03:34:09Z

@regression @provider:galileo
Feature: 57338 Galileo Filter non agreement GDS hotels
  As a corporate traveler using Galileo, that has "Filter non agreement GDS hotels" in the administration
  I want to see only hotels and rooms with agreements

  @priority:high
  Scenario: Agreement badge is visible on every hotel and every room for Galileo
    Given I am logged in as "canisso@checkednonagreementgds.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    Then agreement badge should be visible on all hotels in hotel level results
    Then the "TMC" filter tag should be visible in hotel results
    And the TMC agreement filter is checked in hotel results
    And I select the first hotel result
    When I wait for the first add to trip button to be visible in room level results
    Then agreement badge should be visible on all rooms in room level results
    Then the "TMC" filter tag should be visible in room level results
    And the TMC agreement filter is checked in room level results
