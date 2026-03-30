# Test Name: 27809: Flights - Contact details - Unchecking checkbox refused by default
# Status: Active
# Labels: Flights,contact info,progress page,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-07T08:21:03Z
# Updated: 2025-11-26T05:14:10Z

@regression @flights @general @checkout @contact-info
Feature: 27809 Flights - Contact details unchecking checkbox refused by default
  As a corporate traveler
  I want the contact sharing checkbox to be unchecked by default when configured
  So that I can control whether my contact details are shared

  Scenario: Contact details checkbox is unchecked by default and booking succeeds
    Given I am logged in as "coreytaylor" booking a new trip
    And I have added myself as the traveler
    When I search and add a flight manual quote
    # TODO: Step needed for "Fill free text justification in cart if needed"
    And I click the proceed to checkout button
    # TODO: Step needed for "Verify contact details checkbox is unchecked by default"
    And I complete the booking
    Then I successfully cancel the trip
