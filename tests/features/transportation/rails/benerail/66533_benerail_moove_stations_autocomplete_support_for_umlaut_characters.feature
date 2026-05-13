# Test Name: 66533 Benerail Moove - Stations autocomplete support for umlaut characters
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,search,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-05T05:48:14Z
# Updated: 2025-09-05T07:07:39Z
@wip @transportation @rails @benerail @regression
Feature: 66533 Benerail - Stations autocomplete supports umlaut characters
  As a corporate traveler searching for German or Swiss stations by name
  I want the Benerail autocomplete to correctly handle umlaut characters (ü, ö, ä)
  So that stations like München and Zürich are found when typed with umlauts

  Scenario: Benerail station autocomplete finds stations with umlaut characters
    Given I am logged in as "justinbieber@benerail.com" booking a new trip
    And I have added myself as the traveler
    # NOTE: Search uses umlaut characters: München and Zürich
    # These are stored in benerail.json as "munichToZurich" route
    When I search for a one way Benerail train from "munichToZurich"
    # TODO: The test ends after searching — it only validates that the autocomplete resolves
    # the umlaut station names without error. No cart or booking steps follow.
    # The search step itself constitutes the full validation for this test.
    Then the search results should be displayed for umlaut station names
