# Test Name: 63183 BenerailMoove> Validate improvements on autocomplete
# Description: Validate improvements on autocomplete
# Status: Active
# Labels: Regression,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-06T03:32:48Z
# Updated: 2025-12-23T04:49:29Z
@transportation @rails @benerail @regression
Feature: 63183 Benerail - Autocomplete improvements validation
  As a corporate traveler using the Benerail search form
  I want the station autocomplete to show improved suggestions and behavior
  So that finding stations is faster and more intuitive

  Scenario: Benerail autocomplete improvements are working correctly
    Given I am logged in as "testim@benemoove.com" booking a new trip
    When I navigate to the Benerail rail search tab
    #"Bruxelles Meiser", French spelling without the hyphen, will not be handled now
    Then the Benerail autocomplete improvements should be validated