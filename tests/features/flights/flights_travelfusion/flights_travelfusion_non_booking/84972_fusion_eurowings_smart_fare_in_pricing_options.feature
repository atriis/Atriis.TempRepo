# Test Name: 84972 Travelfusion - Eurowings - SMART fare is displayed in pricing options
# Status: Active
# Labels: Regression,Flights,Fusion,Travelfusion,Eurowings,Pricing Options,Branded Fares
# Owner: Bruna Santos
#
# Domain: Flights | Supplier: Travelfusion | Flow: classic pricing options drawer
# Route: DUS -> BCN (round trip, outbound +30 days / return +35 days) — Eurowings' home
#        route, far enough out that the full branded-fare ladder is still on sale.
# The classic drawer (pricing-options.vue) lays out only 3 fare cards at a time on desktop and
# wraps the rest in an app-carousel, so SMART may sit off-screen behind the next arrow. The
# assertion still needs no arrow stepping: app-carousel renders every panel into the DOM
# (Flicking does not virtualize here) and getPricingOptionsBrandNames reads them with
# allTextContents(), which is visibility-independent. Verified live: the drawer offers 5 fares
# (BASIC, BASIC Flexlight, SMART, BASIC Flexpremium, SMART Flexpremium) and all 5 are read, the
# last two while off-screen. The match is exact, so "SMART" never passes on "SMART Flexpremium".

@regression @flights @fusion @travelfusion @eurowings @pricing-options @branded-fares @priority:medium @tc:84972
Feature: 84972 Travelfusion Eurowings - The SMART fare is offered in pricing options
  As a corporate traveler booking a Eurowings flight via Travelfusion
  I want the SMART fare to be offered among the pricing options
  So that I can pick the branded fare that matches my travel policy

  Scenario: The SMART fare is displayed in the pricing options of a Eurowings flight
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DUS" to "BCN" with outbound in 30 days and return in 35 days
    And flight results should be available
    And I filter airline results by "Eurowings" checkbox
    When I click to open first pricing options
    Then the "SMART" brand should be displayed in pricing options
