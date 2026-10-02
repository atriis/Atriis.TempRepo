# Test Name: 58503 new ui approval email with checkbox
# Description:
# Status: Design
# Labels:
# Owner: Yael Alef
# Created: 2025-02-19T13:09:47Z
# Updated: 2026-02-01T15:07:39Z

@regression @shell @approval_flow @email
Feature: 58503 Approval Flow - New UI approval email opens a confirmation with a checkbox
  As an approver whose corporate requires approval confirmation on pop-up
  I want the accept link in the approval request email to open a confirmation screen
  So that I must tick a checkbox to confirm the purchase before the trip is approved

  Scenario: Accepting the approval request from the email shows the approval confirmation checkbox
    Given I am logged in as "will@pop.com" booking a new trip
    And I have added myself as the traveler
    When I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And I click the proceed to checkout button
    And I send booking for approval
    Then the approval request email for this trip should be received at "atriis-qa@mailsac.com"
    When I click accept in the approval request email
    Then the approval confirmation checkbox "I confirm my approval for the purchase of this trip." should be displayed
