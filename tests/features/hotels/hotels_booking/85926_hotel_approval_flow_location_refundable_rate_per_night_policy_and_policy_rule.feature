# ADO Test Case ID: 85926
@ado:85926
@regression @hotels @approval_flow @provider:ehotel
Feature: 85926 Approval Flow - Hotel approvers by location, refundable, rate per night, policy and policy rule
  As a corporate traveler whose approval flow has hotel approval steps
  I want my out of policy refundable London hotel booking to be sent for approval
  So that every matching approval step adds its approver and no other approver is added

  @priority:high
  Scenario: Hotel approval flow assigns the location, refundable, rate per night, policy and policy rule approvers correctly
    Given I am logged in as "approval@incasehotel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And I select the first OOP justification option and save
    And I fill credit card cvv if needed
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I send booking for approval
    And I view the approvers in the trip overview
    Then the trip overview approvers should be:
      | Alana Viana     |
      | Bill Corgan     |
      | Clara Aguiar    |
      | Daniel Ferreira |
      | Emilly Sarah   |
    And I successfully cancel the trip
