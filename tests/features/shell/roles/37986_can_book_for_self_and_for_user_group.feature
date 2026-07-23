# Test Name: 37986 "Can book for self and for user group" is working as expected
# Description:
# Status: Active
# Labels: Privileges,Regression,traveler,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-17T09:47:19Z
# Updated: 2025-01-17T09:53:19Z

@regression @shell @roles @privileges @traveler
Feature: 37986 - "Can book for self and for user group" is working as expected
  As a corporate travel booker with the "book for self and for user group" privilege
  I want to add another user from my group as the traveler on a new trip
  So that I can book travel on behalf of the users I am authorised to manage

  Scenario: Book for a user in my group by adding them as the traveler
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added traveler by name "Ian Somerhalder"
    Then the traveler name "Ian Somerhalder" is added successfully
