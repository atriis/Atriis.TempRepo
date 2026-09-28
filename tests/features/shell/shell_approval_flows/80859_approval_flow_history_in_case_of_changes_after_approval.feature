# ADO Test Case ID: 80859
@ado:80859
@regression @shell @approval_flow @cars @manual_quote
Feature: 80859 Approval Flow - Approval flow history in case of changes after approval
  As a traveler whose approved trip is changed and sent for approval again
  I want the approvals dialog to keep every past approval in its history
  So that each approval shows up with its date instead of the history being empty (Bug 80781, US 62857)

  Scenario: Approval history lists both approvals after a car is added to an approved trip
    Given I am logged in as "pax@pax12.com" booking a new trip
    And I have added myself as the traveler
    When I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    When I click the proceed to checkout button
    And I click the send for approval button
    When I logout from the application
    And I am logged in as "app@app12.com"
    And I open the trip awaiting my approval from the homepage
    And I approve the trip from the approvals bar
    And I logout from the application
    And I am logged in as "pax@pax12.com"
    And I navigate to the scenario trip
    And I navigate to the manual quote search page from the cart
    And I add a car manual quote with pick up in "New York" and drop off in "San Francisco"
    When I click the proceed to checkout button
    And I click the send for approval button
    When I logout from the application
    And I am logged in as "app@app12.com"
    And I open the trip awaiting my approval from the homepage
    And I approve the trip from the approvals bar
    And I view the approvers in the trip overview
    Then the approval history should list 2 approvals each with an approved on date
