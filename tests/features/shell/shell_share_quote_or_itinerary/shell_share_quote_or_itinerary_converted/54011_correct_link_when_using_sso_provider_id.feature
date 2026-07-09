# Test Name: 54011 correct link when using SSO provider id
# Description:
# Status: Active
# Labels: Email,Cars,Approval flow,Full Purchase,Share Itinerary,SSO,Regression,progress page,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-11-10T05:38:38Z
# Updated: 2025-07-21T10:32:45Z

@regression @shell @share-itinerary @transportation @cars @sso
Feature: 54011 - correct link when using SSO provider id
  As a travel arranger whose organisation authenticates through an SSO provider
  I want the links in the shared itinerary email and the booking confirmation email to carry the correct SSO provider id
  So that recipients open a working, correctly-authenticated trip link instead of a broken one

  @priority:medium
  Scenario: Shared itinerary and confirmation email links carry the correct SSO provider id for a full car purchase
    Given I am logged in as "Sophie@Sop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "lhr"
    And I add the first car to cart
    And I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    # TODO: source captures the on-page trip id via getText(page, ".trip-id") and is marked "//TODO Please add an assertion here"; the value feeds the email-link checks below. No catalog phrase stores the trip id from the ".trip-id" element ("I extract the trip number from the current URL" reads the URL, not this element).
    When I store the trip id for later email link validation
    And I click the share itinerary button
    # TODO: source types a recipient email (global "emailAddress" - value lost in the Testim export) then clicks ".group-user-warper" to pick the group user before sending. "I send the share and see success notification" (sendQuoteAndWaitForSuccess) only clicks send + waits for success; no catalog phrase fills the share recipient.
    And I add the share recipient email and select the group user
    And I send the share and see success notification
    # TODO: core SSO check - source "validate_link_in_manual_send_itinerary_email" wraps an unconverted manual "email-validation-step" (empty body). Verify the link inside the manually-sent itinerary email uses the correct SSO provider id.
    Then the manually-sent itinerary email link should use the correct SSO provider id
    When I proceed to checkout
    And I click book and finalize button
    And I click go to trip button
    Then the booking status should be "Confirmed"
    # TODO: core SSO check - source "validate_the_link_from_email(tripId)" wraps an unconverted manual "email-validation-step" (empty body). Verify the link inside the booking confirmation email uses the correct SSO provider id.
    And the confirmation email link should use the correct SSO provider id
    And I successfully cancel the trip
