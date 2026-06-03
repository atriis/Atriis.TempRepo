# Test Name: HYBRID for 33805 - rail loyalty programs EUR GV THA
# Description: hybrid test - book benerail with loyalty numbers: EUR (4578213), GV (1254786) and THA (8204636).
#   manually - check that the vendor codes and loyalty numbers appear in the log (hold)
# Status: Active
# Labels: Rail,Rail loyalty numbers,hybrid,never failed,Bene seats,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-02-25T07:09:47Z
# Updated: 2025-10-28T09:36:32Z

@regression @benerail @rail_loyalty @hybrid
Feature: 33805 Rail loyalty programs - EUR, GV, THA (Hybrid)
  As a corporate traveler with rail loyalty programs configured
  I want to book a Benerail trip with a specific loyalty number selected
  So that my loyalty number is sent to the supplier during booking

  # NOTE: This is a HYBRID test. After the automated steps complete booking,
  # a manual check is required to verify vendor codes and loyalty numbers
  # appear in the booking log (hold).

  @priority:critical
  Scenario: Book Benerail with EUR loyalty number (4578213)
    Given I am logged in as "tali@loyal.com" booking a new trip
    And I have added myself as the traveler
    # Search Benerail round trip BEABT -> BEBMI
    When I search for a round trip Benerail train from "BEABT-BEBMI"
    And I add a Benerail round trip to the trip
    # Select loyalty number EUR (4578213) and book
    When I select rail loyalty number "EUR" with value "4578213" and proceed to checkout
    # TODO: New step needed — expand loyalty section, click "tab-1" (existing tab),
    # select vendor from dropdown, save, verify green check_circle icon,
    # then accept T&C and proceed to checkout.
    # See choose_loyalty_number_for_EUR__4578213__and_book() in Testim 33805
    And I complete the booking
    Then I successfully cancel the trip
    # TODO: The Testim test uses Trip_Cancelation___warning_and_continue() which
    # is slightly different from the standard cancel — it does page.waitFor(500)
    # instead of 3000. The existing "Then I successfully cancel the trip" should work.

  @priority:critical
  Scenario: Book Benerail with second loyalty vendor and verify
    Given I am logged in as "tali@loyal.com" booking a new trip
    And I have added myself as the traveler
    # Search Benerail round trip BEABT -> BEBMI
    When I search for a round trip Benerail train from "BEABT-BEBMI"
    And I add a Benerail round trip to the trip
    # Select second loyalty vendor and book
    When I select the second rail loyalty vendor and proceed to checkout
    # TODO: New step needed — expand loyalty section, click "tab-1",
    # open vendor dropdown, select 2nd option, save, verify green check,
    # then accept T&C and proceed to checkout.
    # See choose_loyalty_number_for_EUR__4578213__and_book_1() in Testim 33805
    And I complete the booking
    Then I successfully cancel the trip
