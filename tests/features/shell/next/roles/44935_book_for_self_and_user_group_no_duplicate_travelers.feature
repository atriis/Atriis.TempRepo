# Test Name: 44935 [Merge] 'Can book for self and for user group' and 'Can Book On Behalf Of Associated Users Groups' privileges are not duplicating travellers and are able to co-exist
# Description:
# Status: Active
# Labels: Regression,Administration,Privileges,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-18T08:22:06Z
# Updated: 2026-02-17T06:44:35Z

@regression @shell @roles @privileges @traveler
Feature: 44935 - Merge of 'Can book for self and for user group' and 'Can Book On Behalf Of Associated Users Groups' privileges do not duplicate travellers
  As a corporate booker who holds both the book-for-self/user-group and book-on-behalf-of-associated-groups privileges
  I want the two privileges to co-exist without listing the same traveller twice
  So that when I am already added as the traveller I am not offered as a duplicate in the add-traveller autocomplete

  Scenario: A booker already added as the traveller is not offered again as a duplicate in the autocomplete
    Given I am logged in as "amylee@privileges.com" booking a new trip
    And I have added myself as the traveler
    Then the traveler name "Amy Lee" should be visible in the travelers list
    And the traveler "amy lee" should not be available to add
