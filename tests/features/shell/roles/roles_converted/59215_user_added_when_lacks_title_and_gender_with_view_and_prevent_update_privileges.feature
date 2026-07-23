# Test Name: 59215 User Profile - User is successfully added when lacks title and gender, and also has "Can view profile of other users"  and "Prevent updating others and own profile" privileges
# Description:
# Status: Active
# Labels: Profile,Regression,Privileges,"Can view profile of other users","Prevent updating others and own profile",2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-11T09:29:09Z
# Updated: 2026-02-16T02:57:58Z

@regression @shell @roles @privileges @traveler
Feature: 59215 - User is successfully added when lacks title and gender and has view-profile and prevent-update privileges
  As a booker whose profile lacks title and gender and who has "Can view profile of other users" and "Prevent updating others and own profile" privileges
  I want to add another user as a traveler to my new trip
  So that the traveler is saved successfully despite the missing profile fields and the restrictive privileges

  Scenario: Add a traveler by name and confirm they are saved successfully
    Given I am logged in as "camilamaroon@specifictestt.com" booking a new trip
    And I have added traveler by name "Matthew McConaughey"
    # TODO: verify the ".el-notification p" toast reads "The traveller was successfully saved" — back with Search.verifyTravelerSavedNotification (no catalog phrase asserts this specific save-success notification)
    Then the traveller successfully saved notification should be displayed
    And the traveler name "Matthew McConaughey" should be visible in the travelers list
