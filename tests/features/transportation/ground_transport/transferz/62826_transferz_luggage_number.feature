# Test Name: 62826 Transferz - Luggage number is being sent correctly
# Description:
# Status: Active
# Labels: Transferz Regression,Cart,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-29T06:51:35Z
# Updated: 2025-08-04T04:34:49Z

@regression @transportation @ground_transport @provider:transferz
Feature: 62826 Transferz - Luggage number is sent correctly

  As a corporate traveler
  I want my luggage selection to be sent with the Transferz search
  So that the returned transfer options match the requested capacity

  Scenario: Transferz search includes the selected luggage number
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I change number of traveler to "3" and luggage to "3" in Transferz search
    And I search for ground transport from airport "BUD" to specific address "Budapest, Park Plaza Budapest, Bem Rakpart, Hungary"
    And I wait for add to trip text to be visible
    When I capture the "request" payload for request type "TransferzGetQuote" from Storage
     Then the captured "request" payload for request type "TransferzGetQuote" should contain '\"checkedLuggage\":3'
