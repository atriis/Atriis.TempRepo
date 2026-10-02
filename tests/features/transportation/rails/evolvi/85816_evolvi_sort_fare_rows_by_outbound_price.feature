# Test Name: 85816 Evolvi - Sort fare rows by outbound price
# Description: UK Rail results matrix orders fare-type rows from the lowest to the highest outbound price.
#              Sort value per row = lowest non-blank outbound price (blank cells are ignored, never zero);
#              a combined round-trip price (e.g. Anytime Return) is used as stated; ties are ordered by
#              the earlier departure time. Outbound and Inbound share one row order and departure-time
#              columns stay chronological. Rows are re-sorted whenever a new search returns results.
# Source: ADO User Story #84258
# ADO Test Case ID: 85816
@ado:85816
@transportation @rails @evolvi @regression
Feature: 85816 Evolvi - Sort fare rows by outbound price
  As a traveler
  I want UK Rail fare types sorted from cheapest to most expensive
  So that I can identify the best-value fare without comparing every cell myself

  Scenario: One way Evolvi fare-type rows are ordered by lowest outbound price
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "lonToLds"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see outbound text in Evolvi results page
    And the Evolvi fare type rows should be sorted by lowest outbound price
    And the Evolvi outbound departure times should be in chronological order

  Scenario: Round trip Evolvi fare-type rows share one outbound-price order across both legs
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "oxfToWin"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see the Evolvi round trip results page returned train results
    And the Evolvi fare type rows should be sorted by lowest outbound price
    And every Evolvi fare type row should show its outbound and inbound prices side by side
    And the Evolvi outbound departure times should be in chronological order
    And the Evolvi inbound departure times should be in chronological order

  Scenario: Evolvi fare-type rows are re-sorted after a new search
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "lonToLds"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see outbound text in Evolvi results page
    And the Evolvi fare type rows should be sorted by lowest outbound price
    When I navigate back to Evolvi search via breadcrumb
    And I search for a one way Evolvi train from "licToEus"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see outbound text in Evolvi results page
    And the Evolvi fare type rows should be sorted by lowest outbound price
    And the Evolvi outbound departure times should be in chronological order
