# Test Name: 36686 KLM Flight - Price offer mail - summary and body show the same change terms
# Description:
# Status: Active
# Labels: price offer,Regression,AFKL NDC Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-17T01:51:04Z
# Updated: 2025-03-17T11:34:14Z

@regression @shell @afkl @ndc
Feature: 36686 - KLM Flight - Price offer mail - summary and body show the same change terms

  As a travel agent
  I want to share a KLM (AFKL NDC) flight price offer and preview the email
  So that the change terms shown in the price offer summary match the change terms shown in the email body

  Scenario: Share a KLM NDC flight price offer and verify the change terms match between the email summary and body
    Given I am logged in as "florence@afklm.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "BER"
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then "Flight Offer # 1 Pending booking" should be displayed in the share email preview
    When I extract the cancellation and change terms from the price offer email summary
    And I switch the share email preview to detailed view
    Then the cancellation and change terms in the price offer email detailed view should match the summary
