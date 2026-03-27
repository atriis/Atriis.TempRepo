# Test Name: 28941 AA NDC - Seats - Preferred and extra legroom seats are green and show 'Extra legroom' in the tooltip
# Description:
# Status: Active
# Labels: AA NDC Regression,Flights,Seating,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-07-15T10:41:50Z
# Updated: 2025-12-15T12:12:44Z

@to_adjust @flights @aa @ndc @seating
Feature: 28941 AA NDC - Seats - Preferred and extra legroom seats are green

  As a corporate traveler
  I want to select a seat on an AA NDC flight
  So that preferred and extra legroom seats appear in green and show the correct tooltip

  Scenario: Preferred and extra legroom seats are green and tooltip shows correct labels
    Given I am logged in as "ami" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "NYC" to "MIA"
    And I add the first flight to cart
    # TODO: The Testim test adds the 2nd result (.flight-list > :nth-child(2) .btn--primary).
    # Verify whether "I add the first flight to cart" maps to that same element, or a new step
    # like "I add the second flight to cart" is required.
    Then the booking status should be "Pending booking"
    # TODO: Confirm the correct extras index for the seating section in AA NDC cart.
    # In Amadeus NDC (test 28643) the seating section was at index 4. AA NDC may differ.
    # The original Testim step clicked '.flight-seating .is-clickable' to open the seating panel.
    When I click to edit extras at index 0
    And I click add seats in extras
    And I wait for the seat map to load
    # TODO: New step required — the Testim test selects a seat that is:
    #   - Class '.plane-seat.preferred.extra-leg-room' (both preferred AND extra legroom)
    #   - Background color roughly green (r:120-150, g:190-210, b:120-150)
    #   - Has a price symbol ($, €, or £) in its inner span
    # Proposed step: 'When I select a green preferred extra legroom seat'
    # Proposed DSL: Cart.selectGreenPreferredExtraLegroomSeat(page)
    When I select a green preferred extra legroom seat
    # TODO: New step required — the Testim test hovers over the just-selected seat and asserts
    # that the visible tooltip (.el-popper.is-light[aria-hidden="false"]) contains BOTH
    # 'Preferred Seat' AND 'Extra legroom Seat' text.
    # Proposed step: 'Then the seat tooltip should contain preferred and extra legroom labels'
    # Proposed DSL: Cart.verifyPreferredExtraLegroomTooltipVisible(page)
    Then the seat tooltip should contain preferred and extra legroom labels
