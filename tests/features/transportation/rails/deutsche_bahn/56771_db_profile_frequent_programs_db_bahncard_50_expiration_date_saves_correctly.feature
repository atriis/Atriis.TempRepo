# Test Name: 56771 DB - Profile - Frequent Programs - "DB BahnCard 50" expiration date saves correctly
# Description:
# Status: Active
# Labels: Regression,Profile,Frequent flyer,Rail,DB Rail,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-15T10:47:35Z
# Updated: 2025-11-10T01:40:14Z
@wip @transportation @rails @deutschebahn @regression
Feature: 56771 DB - BahnCard 50 expiration date saves correctly
  As a corporate traveler
  I want to manage my DB frequent program details in my profile
  So that the BahnCard expiration date is saved and persisted correctly

  Scenario: Save and remove DB BahnCard 50 with expiration date in profile
    Given I am logged in as "brunorodolfo" booking a new trip
    And I have added myself as the traveler
    # TODO: create step "When I open the traveler profile frequent programs tab" in a new db.steps.js or common/profile steps file
    # covers: Navigating_to_profile_after_adding_traveler()
    When I open the traveler profile frequent programs tab
    # TODO: create step "When I add DB BahnCard 50 with number and expiration date" in db.steps.js
    # covers: k() first half — select DB BahnCard 50, fill card number and expiration date, save
    When I add DB BahnCard 50 with number and expiration date
    # TODO: create step "Then the DB BahnCard 50 expiration date should be saved" in db.steps.js
    # covers: k() validation — verifies saved expiration date value is displayed
    Then the DB BahnCard 50 expiration date should be saved
    # TODO: create step "When I remove the DB BahnCard frequent program entry" in db.steps.js
    # covers: k() second half — remove frequent program and confirm dialog
    When I remove the DB BahnCard frequent program entry
