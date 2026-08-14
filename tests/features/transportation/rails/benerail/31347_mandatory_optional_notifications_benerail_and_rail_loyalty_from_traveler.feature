# Test Name: 31347 MERGED mandatory and optional notifications for benerail by origin and destination + Rail loyalty numbers come from the traveler (and not from the booker)
# Description: Bug 72116: Push Notifications not triggered by BeneMoove stations> new Distribution related
#   mandatory and optional notifications appear when searching Benerail from NLASC to BEBCE,
#   and when adding the Benerail round trip to the cart. (Source description also carries a copy-paste
#   of the flight/Zimbabwe wording from 29774 — the subject here is Benerail rail, not flight.)
# Status: Active
# Labels: push notifications,No Amadeus Hotel Book,Regression,Rail loyalty numbers,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2024-02-08T11:46:19Z
# Updated: 2026-01-21T10:48:10Z
#
# Source: tests/testim/active/regression_set_new_front/shell/push_notifications/
#   31347_merged_mandatory_and_optional_notifications_for_benerail_by_origin_and_destination+rail_loyalty_numbers_come_from_the_traveler_(and_not_from_the.js
# MERGED test — two subjects:
#   A) mandatory + optional notifications appear by origin/destination (NLASC -> BEBCE) at search and in the notification center.
#   B) rail loyalty numbers come from the traveler (tali loyal), not the booker.

@regression @shell @push-notifications @notification-center @rails @benerail @rail-loyalty
Feature: 31347 - Merged Benerail notifications by origin and destination, and rail loyalty numbers from the traveler
  As a traveler booking a Benerail train with mandatory notifications
  I want origin/destination notifications to appear and be listed in the notification center
  And the rail loyalty numbers to come from the traveler rather than the booker
  So that required information is surfaced and the traveler's own loyalty numbers are used

  Scenario: Benerail origin and destination notifications appear and merge in the notification center, with loyalty numbers from the traveler
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "tali loyal"
    And I search for a round trip Benerail train from "nlascToBebce"
    And I click proceed button if visible
    # Asserts BOTH notifications configured for NLASC -> BEBCE: the optional one as a toast (it
    # auto-dismisses after 7s, hence right after the search) and the mandatory one in the popup, which
    # is left open for the acknowledge step below.
    Then the mandatory and optional notifications for the Benerail "optional notification for benerail from NLASC to BEBCE" should be displayed
    When I acknowledge the push notification
    And I add a Benerail round trip to the trip
    Then the booking status should be "Pending booking"
    When I open the notification center
    Then the notification center should display the following notifications:
      | optional notification for benerail from NLA ...   |
      | optional notification for benerail from NLA ...   |
      | mandatory notification for benerail from NL ...   |
    When I close the notification center
    And I expand the loyalty number extras section
    Then the rail loyalty numbers from the traveler should be displayed:
      | Club Eurostar - 0000 |
      | SNCF Voyageur - 5780 |
