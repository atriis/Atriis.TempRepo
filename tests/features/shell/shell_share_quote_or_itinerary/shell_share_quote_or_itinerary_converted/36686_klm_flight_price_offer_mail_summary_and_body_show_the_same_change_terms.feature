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
    # TODO: [actions 28-29] No catalog phrase. Source read the summary-view change terms (cancellation and changes) via getText but never asserted them (two "//TODO Please add an assertion here" comments). Extract them so they can be compared against the detailed/body view.
    When I extract the cancellation and change terms from the price offer email summary
    And I switch the share email preview to detailed view
    # TODO: [actions 32-35] No catalog phrase. This is the core of the test ("summary and body show the same change terms"). Source waited on four body-view spans (cancellation x2, changes x2) but compared them against undefined variables (cancellationanytime / changesanytime), so the equality check was never completed. Assert the detailed-body change terms equal the summary change terms.
    Then the cancellation and change terms in the price offer email detailed view should match the summary
    And I close the share dialog
