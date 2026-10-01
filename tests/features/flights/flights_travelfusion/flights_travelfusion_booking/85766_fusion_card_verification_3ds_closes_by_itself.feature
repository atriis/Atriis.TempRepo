# Test Name: 85766 Fusion - Card verification (3DS) completes and closes by itself after booking a low-cost flight
# Status: Active
# Labels: Regression,Fusion,Flights,Full Purchase,3DS
# Owner: Yael Alef
# Created: 2026-10-01

# ADO Test Case ID: 85766
# Source: ADO Bug #85679 - OBT - Fusion - Cc verification not working
#
# After the traveller completes Fusion card verification, Travelfusion redirects the 3DS iframe back to
# OBT /payment-token/?quoteId=<id>. That cross-site navigation carries no login cookie, so before the fix
# Heimdall answered it with a redirect to the identity server and the iframe showed "... refused to connect".
# The older Fusion steps close the modal with its X and never reach /payment-token; this one clicks the
# supplier's submit inside the iframe and expects /payment-token to answer 200 and the modal to close by itself.

@regression @flights @fusion @full-purchase @3ds @lcc
Feature: 85766 Fusion - Card verification (3DS) completes and closes by itself
  As a traveller booking a Fusion low-cost flight
  I want the card verification to return to OBT once I complete it
  So that the booking continues without a login page or an error inside the verification window

  Scenario: Completing the Fusion 3DS verification inside the iframe closes the modal by itself
    Given I am logged in as "fusionCorp@reg.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LGW" to "MXP"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking with Fusion credit card verification inside the 3DS iframe
    Then the Fusion card verification should return to OBT and close by itself
    And the ticket details should be visible after booking
