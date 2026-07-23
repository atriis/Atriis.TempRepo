# Test Name: 27010 Only "Adult" is displayed as traveller type
# Description:
# Status: Active
# Labels: Regression,Role,traveler,Adding Passengers,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-16T01:21:26Z
# Updated: 2026-02-16T03:05:16Z

@regression @shell @roles @privileges @traveler
Feature: 27010 - Only "Adult" is displayed as traveller type
  As a corporate travel booker whose role restricts passenger types
  I want the guest traveler form to offer only "Adult" as the traveller type
  So that I cannot add non-adult passengers (Child, Senior, Lap Infant, etc.) that my privileges do not allow

  Scenario: Guest traveler form exposes only Adult as the traveller type
    Given I am logged in as "olgay@amsalem.com" booking a new trip
    When I open the add guest traveler form
    # TODO: open the guest form traveller-type dropdown and assert it offers exactly one option, "Adult (Ages 18+)" — back with Search.verifyOnlyGuestPassengerType (open SELECTORS.TRAVELER_TYPE_SELECT, count visible SELECTORS.TRAVELER_TYPE_OPTION items === 1 and that its label contains the given text)
    Then the only available guest traveller type should be "Adult (Ages 18+)"
