# Test Name: 40231 [Merge] Manual Quote - Can select from available credit cards and card type is displayed and "Back" button is displayed
# Status: Active
# Labels: Regression,Manual Quote,Cars,FOP,No Amadeus Hotel Book,merge,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-19T04:15:06Z
# Updated: 2026-02-17T08:58:29Z
@regression @manual_quote @cars @fop
Feature: Manual Quote - Credit card selection and Back button on Car manual quote
  As a corporate traveler
  I want the manual quote Car form to expose all available credit cards and a Back button
  So that I can pick the right form of payment or return to the trip

  @priority:high
  Scenario: Manual quote Car form displays credit cards, card type and Back button
    Given I am logged in as "brunasantos@manualquote.com" booking a new trip
    When I navigate to the manual quote search page
    Then the manual quote page should warn "Please add traveller for this trip."
    When I have added myself as the traveler
    Then the manual quote page title should mention "quote"
    And a Back button should be displayed on the manual quote page
    When I navigate to car search form
    And I scroll to the manual quote car form of payment section
    And I open the manual quote car form of payment dropdown
    Then the credit card "testim one" should be available
    When I select the credit card "testim one"
    Then the manual quote car card type should display "Visa Credit"
    When I open the manual quote car credit type dropdown
    Then the credit type dropdown should list the following card types
      | MasterCard      |
      | American Express|
      | Diners Club     |
      | Discover        |
      | Visa Credit     |
      | Air Plus        |
      | EHotel          |
    When I click the Back button on the manual quote page
    Then the welcome heading should contain "Welcome"
