# Test Name: 64936 Evolvi > e-ticket link exist on share itinerary
# Description: e-ticket link exist confirmation. NOTE: Can only be run on grid!
# Status: Active
# Labels: Regression,Rail,Evolvi,Full Purchase,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-07-29T10:23:17Z
# Updated: 2025-09-14T12:56:04Z
# The e-ticket number is read twice: from the booked quote in the trip overview and from the
# share itinerary preview (the same backend-generated HTML the mail server sends), then the two
# are compared. Share-preview content uses a label+content two-row pattern, so a reader must fall
# through to the next sibling row when the label's own row is empty.
@transportation @rails @evolvi @regression @wip
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
    # TODO: fill the three mandatory general preference question fields on the checkout page
    And I fill in the general preference questions in checkout
    And I complete the booking
    # TODO: read and store the e-ticket number shown on the booked UK Rail quote in the trip overview
    And I extract the e-ticket number from the trip overview
    When I click the share itinerary button
    And I wait to see "Subject" field in share dialog
    # TODO: assert the share itinerary preview contains the e-ticket download link
    Then the e-ticket link should be displayed in the share itinerary preview
    # TODO: read and store the e-ticket number shown in the share itinerary preview
    When I extract the e-ticket number from the share itinerary preview
    # TODO: click the e-ticket link in the share itinerary preview and capture the resulting download
    And I click the e-ticket link in the share itinerary preview
    # TODO: assert the file downloaded from the e-ticket link is received and is not empty
    Then the e-ticket file should be downloaded
    # TODO: compare the e-ticket number read from the share itinerary against the trip overview one
    And the e-ticket number in the share itinerary should match the trip overview
