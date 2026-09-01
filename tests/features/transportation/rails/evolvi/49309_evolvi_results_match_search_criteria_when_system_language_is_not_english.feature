# Test Name: 49309 Evolvi - Results match search criteria when system language is not English
# Description:
# Status: Active
# Labels: Regression,results,Rail,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-08-01T12:06:51Z
# Updated: 2025-10-30T12:36:22Z
@transportation @rails @evolvi @regression
Feature: 49309 Evolvi - Results match search criteria when system language is not English
  As a corporate traveler
  I want to repeat an Evolvi UK Rail round trip search after switching the system language away from English
  So that the results still match the search criteria when the application is not in English

  Scenario: Evolvi - Results match search criteria when system language is not English
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    # The display language is persisted on the user profile, so a run that ended before switching
    # back leaves the account in German. Reset it here, while the trip is still empty — switching
    # reloads the app, and a reload after the traveller is added drops the search form.
    And I switch the application language to "English (UK)"
    # The reload the switch triggers drops the trip back to its default product, whose form has no
    # traveller field — pick UK Rail first so the traveller can be added.
    And I select UK Rail in the search form
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "bthToPad"
    And I dismiss the mandatory notifications popup if displayed
    Then the Evolvi outbound results heading should read "Outbound"
    # Both searches must stay inside THIS trip: the payload lookups below are scoped to one trip id,
    # so a second trip would split the two otaRailAvail requests across two stores.
    # The reminder popup is raised again by each search and is modal — it swallows the hover on the
    # language globe, so it has to be cleared right before the switch, not just after the search.
    When I dismiss the mandatory notifications popup if displayed
    And I switch the application language to "German"
    And I search for a round trip Evolvi train from "bthToPad"
    And I dismiss the mandatory notifications popup if displayed
    Then the Evolvi outbound results heading should read "Hinreise"
    And outbound times start at "07:00" and inbound times start at "16:00"
    When I dismiss the mandatory notifications popup if displayed
    And I go back to the homepage
    And I switch the application language to "English (UK)"
    Then the welcome heading should contain "Welcome Thiago Santos"
    When I capture the "request" payload for request type "otaRailAvail" from Storage
    Then exactly 2 "otaRailAvail" requests should have been sent
    And every "otaRailAvail" request should have "DepartureDateTime" within "OriginDestinationInformation" containing "07:00:00"
    And every "otaRailAvail" request should have "DepartureDateTime" within "ReturnDateTime" containing "16:00:00"
