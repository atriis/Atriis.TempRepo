# Test Name: 26954 MERGED can add guests (child, senior, youth, lap infant, seat infant) but cant proceed to search
# Description: the user can add guest, birth date relevant to the type, tag bby the type, cant proceed to search (error message appears), can continue with request assistance, display 'please select gender' instead of 'preffer not to say'
# Status: Active
# Labels: multi PTC,guest,Adding Passengers,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-08T02:01:40Z
# Updated: 2026-01-15T12:23:29Z

@regression @shell @guest @adding_passengers @multi_ptc
Feature: 26954 Shell - Can add non-adult guests but cannot proceed to search

  As a travel arranger
  I want to add guest travelers of different passenger types (child, senior, youth, lap infant, seat infant)
  So that I can verify the guest is tagged by type but cannot proceed to an online search for non-adult passengers

  Scenario Outline: Add a <ptc> guest and verify the search is blocked for non-adult passengers
    Given I am logged in as "shani@testimcorpnl.com"
    When I book a new trip
    And I open the add guest traveler form
    And I select the passenger type "<ptc>" for the guest traveler
    And I fill in the guest traveler first name "<firstName>" and last name "<lastName>"
    # Initial DOB intentionally set to an adult date to confirm it gets re-validated against the selected passenger type
    And I fill in the guest traveler date of birth "08/02/1986"
    And I click the guest traveler email field
    Then the guest traveler email field should show the error "This field is required"
    When I fill in the guest traveler date of birth "<dateOfBirth>"
    And I fill in the guest traveler email "<email>"
    And I click the add guest button
    Then the passenger type tag should display "<ptc>"
    And the search should display the message "Online searches are currently available for adults only. For different user types please use"
    # TODO: html-attr-validation from Testim (request assistance link attribute check) must be converted manually
    When I click the request assistance icon
    Then the travelers section title should display "Who are the travellers?"
    And the passenger type tag should display "<ptc>"

    Examples:
      | ptc        | firstName | lastName | dateOfBirth | email              |
      | Child      | Amit      | Israeli  | 05/04/2020  | amit@israeli.com   |
      | Senior     | Avraham   | Israeli  | 06/03/1950  | avraham@israeli.com|
      | Youth      | Ido       | Israeli  | 08/07/2010  | ido@israeli.com    |
      | Lap Infant | Rotem     | Israeli  | 02/01/2026  | rotem@israeli.com  |
      | Seat Infant| Shaked    | Israeli  | 10/03/2025  | shaked@israeli.com |
