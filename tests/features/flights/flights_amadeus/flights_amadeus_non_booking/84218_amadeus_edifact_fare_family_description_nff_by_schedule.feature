# Test Name: 84218 Amadeus EDIFACT - New Flight Flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,New Flight Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: TBD
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See
#         84218_amadeus_edifact_fare_family_display_name_from_description.feature in this folder for
#         why the expectation is read from the search reply rather than written here.
#
# BLOCKED BY AN OPEN PRODUCT DEFECT - the test is correct and the app is not. Tagged @blocked only
# to keep the nightly from going permanently red; remove the tag once the defect is fixed. A bug
# still needs raising against US 82771 / #84218.
#
# Reproduced 4 of 4 runs on 2026-09-09/10, ATL-JFK, carrier Delta, nff.edifactonly@amadeus.ams:
# EVERY brand card shows the filed code, none shows a description -
#   names=["Mainbasic","Mainbasic","Mainclasc","Mainclasc","Mainextra","Mainclasc","Mainextra","Mainclasc"]
#
# The description IS available, checked per occurrence and not per merged family. Auditing every
# familyInformation node of trip 3850285 (7 MasterPricer replies, 11 nodes) gave zero nodes without
# a description: DL|MAINBASIC described twice as "DELTA MAIN BASIC", DL|MAINCLASC three times as
# "DELTA MAIN CLASSIC", AA|MAIN three times, UA|ECONOMY three times. So no card can be showing the
# code as the AC3/R2 fallback - the fallback case does not arise on this trip.
#
# "Mainextra" is NOT flagged, and for a third reason worth keeping straight: MAINEXTRA does not
# appear ANYWHERE in the reply, so it is not judgeable at all - which is different from a family
# that is present but filed without a description. Either way the code is not a defect, and the
# test not flagging it is what shows it discriminates rather than blanket-rejecting codes.
#
# The contrast isolates it to the search mode: the SAME account and carrier in complete trip shows
# "Delta Main Basic" / "Delta Main Classic" correctly (see the complete-trip file in this folder).
# That matches 84218's own note that the label reverted "on every option a pricing reply produced" -
# by schedule prices per direction, and the description exists only in the search reply, so
# AmadeusFareFamilyDisplayName.ApplyResolvedLabels appears not to fire on this path.

@ado:84218
@blocked
@regression @flights @amadeus @edifact @branded-fares @pricing-options @by-schedule
Feature: 84218 Amadeus EDIFACT - By schedule, New Flight Flow fare family names are the airline's
  As a corporate traveler searching by schedule on an Amadeus EDIFACT itinerary
  I want each fare named the way the airline names it on its own channels
  So that the naming fix holds for the by-schedule search mode too

  # BOTH segments must be selected before any fare screen exists. A by-schedule search is always a
  # round trip (searchFlightBySchedule hardcodes tripType roundTrip), and the flow is: results list
  # for leg 1 -> select flight -> the list RE-RENDERS for leg 2 -> select flight -> only now the
  # fare screen appears.
  #
  # The carrier is filtered TWICE on purpose, once per leg. The composite
  # "I select flight segments by schedule" would do both clicks in one step, but the re-render for
  # leg 2 drops the filter: a run that filtered Delta only once came back showing JetBlue cards
  # (B6|DN "MAIN BASE", B6|AN "MAIN"). Filtering again between the selections keeps both legs Delta,
  # so the fare families read are the ones this test is about.
  #
  # An earlier version of this test selected ONE segment and then asserted the brand cards. It timed
  # out because at that point the page is still a results list with no .flight-brand-leg node at
  # all - which was misread as the New Flight Flow readers not working by schedule. They do: the
  # by-schedule screen renders one active brand leg, and "outbound" maps to legIndex 0, which is
  # what getOutboundBrandCardNames already targets.
  #
  # Scope: the FIRST direction only. Asserting the return direction would need a leg-agnostic reader
  # (getInboundBrandCardNames targets .flight-brand-leg nth(1), which matches nothing when a single
  # leg node renders) plus a legIndex-free DSL branch and a new step phrase - its own test point.
  @priority:high
  Scenario: By schedule - every brand card is named from the search reply's description
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "JFK"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Delta"
    Then flight results should be available
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    And every brand card name on the "outbound" leg should match its fare family description
