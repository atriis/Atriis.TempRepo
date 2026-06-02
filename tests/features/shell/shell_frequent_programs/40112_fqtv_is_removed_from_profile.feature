# Test Name: 40112 FQTV is removed from profile
# Description: 
# Status: Active
# Labels: Regression,FQTV,Profile,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-31T07:28:49Z
# Updated: 2025-07-14T07:31:05Z

@regression @fqtv @profile
Feature: 40112 FQTV is removed from profile
  As a corporate traveler
  I want to remove and re-add my FQTV (Frequent Flyer) number from my profile
  So that I can manage my frequent flyer programs correctly

  @priority:critical
  Scenario: Remove FQTV from profile and add it back
    Given I am logged in as "ritalee@frequentprogram.com"
    When I navigate to my user profile
    And I open the frequent programs tab in my profile
    And I remove the FQTV entry "123456543" from my profile
    Then the FQTV entry should no longer be visible in my profile
    When I add a new FQTV entry with number "123456543" using the first available airline
    Then I should see a success notification
