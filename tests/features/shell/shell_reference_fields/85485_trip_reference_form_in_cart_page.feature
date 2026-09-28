# ADO Test Case ID: 85485
@shell @reference_fields @regression @transportation @cars @booking @provider:general @priority:high @ado:85485
Feature: 85485 Reference Fields - Trip Reference Form in Cart page

  As a booker submitting a car booking for approval online
  I want the answers I gave at the new-trip and checkout stages to be kept in the trip reference form
  So that I can review the trip's reference information from the cart after booking

  Scenario: Trip reference form shows the new-trip and checkout reference answers after a car booking
    Given I am logged in as "pax@pax12.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "LHR"
    And I select the "dropdown answers" reference field as "David"
    And I click proceed on the reference fields popup
    And I add the first car to cart
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Text" reference field with "trip FR form"
    And I send booking for approval
    When I open the read-only trip reference form from the trip overview
    Then the reference fields should have the following values:
      | field            | value        |
      | dropdown answers | David        |
      | Text             | trip FR form |
    When I close the trip reference form in the trip overview
    Then I successfully cancel the trip
