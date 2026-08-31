# ADO #83174 - [Distribusion] Support Agreements For SNCF

@provider:distribusion @regression @priority:high @ado:83174
Feature: 83174 Distribusion - One way SNCF booking is created end to end

  As a corporate traveler on a Distribusion-enabled account
  I want to search, select and book a one way SNCF train through Distribusion
  So that Distribusion bookings are confirmed successfully by the supplier

  Scenario: One way Distribusion SNCF booking is finalized successfully
    Given I am logged in as "tanya@dist.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "frpmoToFrnte" on the 1 "friday" of next month
    And I wait for select text to be visible
    And I select the first Benerail option
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the trip overview should show the journey details button
