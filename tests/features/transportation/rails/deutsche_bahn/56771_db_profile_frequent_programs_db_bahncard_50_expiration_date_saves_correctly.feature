# Test Name: 56771 DB - Profile - Frequent Programs - "DB BahnCard 50" expiration date saves correctly
# Description:
# Status: Active
# Labels: Regression,Profile,Frequent flyer,Rail,DB Rail,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-15T10:47:35Z
# Updated: 2025-11-10T01:40:14Z
@transportation @rails @deutschebahn @regression
Feature: 56771 DB - BahnCard 50 expiration date saves correctly
  As a corporate traveler
  I want to manage my DB frequent program details in my profile
  So that the BahnCard expiration date is saved and persisted correctly

  Scenario: Save and remove DB BahnCard 50 with expiration date in profile
    Given I am logged in as "brunorodolfo@dbrail.com" booking a new trip
    And I have added myself as the traveler
    And I open the traveler profile from the traveler name
    And I open the frequent programs tab in my profile
    When I add DB BahnCard 50 with number "7081876567890765" and expiration date "20 Dec 2029"
    Then I should see a success notification
    Then the DB BahnCard 50 expiration date "20 Dec 2029" should be saved
    And I successfully remove the DB BahnCard frequent program entry
