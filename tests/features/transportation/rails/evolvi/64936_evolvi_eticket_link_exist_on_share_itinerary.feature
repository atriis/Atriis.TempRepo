# Test Name: 64936 Evolvi > e-ticket link exist on share itinerary
# Description: e-ticket link exist confirmation. NOTE: Can only be run on grid!
# Status: Active
# Labels: Regression,Rail,Evolvi,Full Purchase,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-07-29T10:23:17Z
# Updated: 2025-09-14T12:56:04Z
# The Eticket reference is read off the booked quote in the trip overview, then the share itinerary
# preview (the same backend-generated HTML the mail server sends) has to both serve that ticket as a
# downloadable file and quote the same reference. The email's wording is not in this repo's source,
# so the e-ticket link is found by what it points at — the wallet links ruled out first.
@transportation @rails @evolvi @regression
Feature: 64936 Evolvi - e-ticket link exist on share itinerary
  As a corporate traveler
  I want an e-ticket link on the itinerary I share after booking a UK Rail journey
  So that I can download my e-ticket from the shared itinerary

  Scenario: The e-ticket link is available on the shared itinerary of an Evolvi booking
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I search for a one way Evolvi train from "182To115"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I select the "eTicket Queue" delivery method and save
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Cost Code" reference field with "1234"
    And I fill in the "Legal Entity" reference field with "4321"
    And I fill in the "Business Area" reference field with "2565"
    And I complete the booking
    And I extract the e-ticket number from the trip overview
    When I click the share itinerary button
    And I wait to see "Subject" field in share dialog
    And the wallet link "Get your PKPASS (Apple Wallet)" should be visible in itinerary
    And the wallet link "Get your Ticket (Google Wallet)" should be visible in itinerary
    And I click the e-ticket link in the share itinerary preview
    Then the e-ticket file should be downloaded
    And the e-ticket number in the share itinerary should match the trip overview
