# ADO #83388 - Distribusion only search method
# tanya@dist.corp is a Distribusion-only account: typing "Paris" in the EU Rail From station field
# lists the Paris city row first, followed by its stations in Distribusion's order.

@transportation @rails @provider:distribusion @regression @ado:83388
Feature: 83388 Distribusion only search method
  As a corporate traveler using the Distribution search form
  I want rail list order by city-grouped autocomplete

  Scenario: Rail list is order by city-grouped autocomplete
    Given I am logged in as "tanya@dist.corp" booking a new trip
    When I navigate to the Benerail rail search tab
    And I type "Paris" in from station location
    Then you should see exactly "Paris" as the 1 option
    And you should see exactly "Paris Est (FR)" as the 2 option
    And you should see exactly "Paris Nord (FR)" as the 3 option
    And you should see exactly "Paris Bercy (FR)" as the 4 option
    And you should see exactly "Paris St Lazare (FR)" as the 5 option
    And you should see exactly "Paris Austerlitz (FR)" as the 6 option
    And you should see exactly "Paris Gare de Lyon (FR)" as the 7 option
    And you should see exactly "Paris Montparnasse (FR)" as the 8 option
