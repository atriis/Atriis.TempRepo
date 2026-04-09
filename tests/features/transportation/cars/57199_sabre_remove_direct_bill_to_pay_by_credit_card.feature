# Test Name: 57199 Remove Direct Bill to pay by CC
# Labels: Sabre, Cars, Full Purchase, Regression, Sanity, progress page
# Owner: Shani Hadar
# Created: 2025-12-12T04:55:16Z
# Updated: 2026-02-04T12:38:49Z

@regression @cars @sabre @sanity @full-purchase
Feature: 57199 Sabre billback removal and credit card payment

  As a traveler with a direct bill agreement
  I want to remove direct billing and pay by credit card
  So that I have payment flexibility

  Background:
    Given I am logged in as "victor" booking a new trip
    And I have added traveler by name "Pedro Carneiro"

  @priority:high
  Scenario: Remove Sabre agreement direct bill and pay by credit card
    When I search for a car at "LHR"
    # TODO: Complete reference fields after car search
    Then the agreement should be validated
    When I add the first car to cart
    # TODO: Verify and remove billback, confirm credit card payment option
    And I cancel the trip
    Then I successfully cancel the trip
