# Test Name: Benerail Moove - Corporate program is being correctly sent
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@wip @transportation @rails @benerail @regression
Feature: 61642 Benerail Moove - Corporate program is being correctly sent
  As a corporate traveler
  I want to book a one way Benerail trip with a corporate program account
  So that I can confirm the corporate program identifier is correctly sent in the booking request

  Scenario: Corporate program is correctly sent during Benerail one way booking
    Given I am logged in as "bruolisan@benerailmoovecorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    When I add a Benerail one way to the trip
    When I proceed to checkout
    When I complete the booking
    Then the trip overview should show the journey details button
    When I capture the "request" payload for request type "Patch Order -bookings/bookings/orders PATCH" from Storage
    Then the captured "request" payload for request type "Patch Order -bookings/bookings/orders PATCH" should not contain "44554455".onKey("distributionCorporateLoyalty")
    When I capture the "request" payload for request type "Update Booking (Trip Reference) -bookings/bookings PATCH" from Storage
    Then the captured "request" payload for request type "Update Booking (Trip Reference) -bookings/bookings PATCH" should contain "44554455".onKey("distributionCorporateLoyalty")