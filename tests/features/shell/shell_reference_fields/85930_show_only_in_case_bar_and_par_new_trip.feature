# ADO Test Case ID: 85930
@shell @reference_fields @regression @flights @provider:galileo @priority:high @ado:85930
Feature: 85930 Reference Fields - Show only in case BAR and PAR on the new-trip form

  As a booker on a Galileo account whose company has a BAR and whose travellers may have a PAR
  I want reference fields configured with a BAR / PAR / guest display condition to show only where it applies
  So that each traveller is asked only the questions relevant to their profile

  Scenario: New-trip reference fields are shown only for the BAR, PAR and guest conditions that apply
    Given I am logged in as "galileoPAR@gdg.corp" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Alexggg"
    And I have added a random guest traveler with name "Guest" "Rfauto"
    When I search for a round trip flight from "FRA" to "LON" without clicking search button
    And I click on the flight tab and uncheck Add hotel to this trip and Add car to this trip
    And I click the search button
    Then the request assistance reference fields are displayed in the following order:
      | BAR contain LH20000000009 New trip |
      | BAR exist                          |
    And the reference fields for traveler "Jonathan Taylor" in the popup should be exactly:
      | PAR exist      |
      | Is not a guest |
    And the reference fields for traveler "Alexggg" in the popup should be exactly:
      | Is not a guest |
    And the reference fields for traveler "Guest Rfauto" in the popup should be exactly:
      | Is a guest |
