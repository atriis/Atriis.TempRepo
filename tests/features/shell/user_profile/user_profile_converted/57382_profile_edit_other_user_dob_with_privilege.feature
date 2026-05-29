# Test Name: 57382 Profile - User with "Can edit and view profile for other users" privilege can edit DOB field
# Description:
# Status: Active
# Labels: Regression,Flights,Profile,Privileges,edit,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-28T01:55:41Z
# Updated: 2026-01-06T09:02:09Z

@regression @profile @privileges @dob
Feature: 57382 Profile - Edit DOB for other users with privilege
  As a user with "Can edit and view profile for other users" privilege
  I want to edit the date of birth field of another traveler
  So that I can correct traveler information when needed

  @priority:high
  Scenario: User with edit privilege can modify DOB of another traveler
    Given I am logged in as "franciscosantos@editprofileprivilege.com" booking a new trip
    And I have added traveler by name "ruimariano"
    # TODO: Step needs implementation — wait for ".traveler-name" to show name, click it
    # DSL candidate: Profile.openTravelerProfile(page, travelerName)
    When I open the traveler profile for "Rui Mariano"
    # TODO: Step needs implementation — click DOB field, navigate to next month, select a date
    # DSL candidate: Profile.editDateOfBirth(page)
    And I edit the date of birth to a new date
    # TODO: Step needs implementation — assert the DOB field value changed
    # DSL candidate: Profile.verifyDobUpdated(page)
    Then the date of birth should be updated
