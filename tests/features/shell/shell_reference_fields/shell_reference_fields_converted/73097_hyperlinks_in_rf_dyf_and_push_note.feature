# Test Name: 73097 Hyperlinks in RF and DYF and Push note
# Description:
# Status: Active
# Labels: Regression,Reference Fields,push notifications,2026 plan 2
# Owner: pini harush
# Created: 2026-01-29T06:50:39Z
# Updated: 2026-01-29T07:30:00Z

@shell @reference_fields @dynamic_fields @regression @push_notifications
Feature: 73097 - Hyperlinks in reference fields, dynamic fields and push notes

  As a booker
  I want hyperlinks in reference fields, dynamic fields and push notes to open the linked page
  So that I can reach the linked information from each surface

  Scenario: Hyperlinks in reference fields and push notes open the linked page
    Given I am logged in as "new@guy33.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "ams" to "sin"
    # TODO: implement step - verify the reference field hyperlink opens the linked page ("Google Search")
    Then the reference field hyperlink opens the linked page
    When I click proceed on the reference fields popup
    # TODO: implement step - verify the mandatory push-notification note hyperlink opens the linked page
    Then the mandatory notification hyperlink opens the linked page
    # TODO: implement step - acknowledge the mandatory notification
    When I acknowledge the mandatory notification
    When I add the first flight to cart
    # TODO: implement step - verify the push note hyperlink in the cart notifications opens the linked page
    Then the cart push note hyperlink opens the linked page
