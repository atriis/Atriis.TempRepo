# Test Name: 56738 Evolvi - warning regarding class changes between legs
# Description: as pini@gov.nl> go to 3451653> Leg 4 should show the msg
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2025-01-14T03:13:55Z
# Updated: 2025-06-24T10:50:27Z
@transportation @rails @evolvi @regression @wip
Feature: 56738 Evolvi - warning regarding class changes between legs
  As a rail booker
  I want to see a note on an Evolvi journey leg whose reservation class differs from the ticket class
  So that I know in advance that part of the journey will not be seated in the class I paid for

  Scenario: The class change note is displayed on the Evolvi leg with a downgraded reservation class
    Given I am logged in as "pini@gov.nl"
    When I navigate to trip 3451653
    Then the booking status should be "Pending booking"
    # TODO: assert the mandatory Seating extras section is displayed for the Evolvi (UK rail) quote in the cart, with its mandatory asterisk on the "Seating" title
    And the Seating extras section should be displayed as mandatory for the Evolvi quote
    # TODO: expand the Evolvi (UK rail) Seating extras section in the cart by clicking its Add/Edit trigger, and wait for the seat panel to finish loading
    When I open the Evolvi seating extras section in the cart
    # TODO: assert the class change note on the given Evolvi journey leg contains the expected text, e.g. leg 4 shows "First class ticket but reservation will be in Standard class"
    Then the class change note for Evolvi leg 4 should contain "First class ticket but reservation will be in Standard class"
