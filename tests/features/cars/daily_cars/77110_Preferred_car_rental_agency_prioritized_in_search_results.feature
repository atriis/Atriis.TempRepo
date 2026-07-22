# Test Name: 76501 Preferred car rental agency not prioritized in search results
# Labels: Regression, Cars, Travel Policy, Sabre, vendor-priority
# Bug: https://dev.azure.com/atriis/TMC2/_workitems/edit/76501
# Owner: QA (auto-generated via e2e-test-pipeline)
# Domain: transportation (Sabre Cars)
# Staging User: support@lake.com (USER_SUPPORTLAKE)
# Location: LHR
# ADO Test Case: #77110 - [Cars][Sabre] Preferred car rental agency prioritized in search results

@daily_cars @provider:sabre @regression @priority:high @ado:77110
Feature: 76501 Preferred car rental agency prioritized in search results

  As a traveler with a configured preferred rental agency policy (Avis Compact)
  I want to see Avis results at the top of car search results at LHR
  So that the in-policy vendor is correctly prioritized

  Background:
    Given I am logged in as "car@priority.com" booking a new trip
    And I have added myself as the traveler

  @priority:high @tc:77110
  Scenario: Preferred vendor Avis appears first in default car results at LHR
    When I search for a car at "LHR"
    Then the first car result should be from rental agency "Avis"
    And the out of policy indicator should not be visible in results
