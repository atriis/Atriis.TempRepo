# Test Name: 77108 Ypsilon- Display all brands in pricing options
# Status: Design
# Labels: Regression,Flights,Ypsilon,Aer Lingus,Branded fares,Pricing Options,Payload
# Owner: Bruna Santos
#
# Ypsilon files each brand as the extFlightInfo of a <flight> in its "Fare" response, tied to the
# legs it covers by <legXRef legId>; the response's <leg> list gives each legId's carrier, flight
# number and date. The Pricing Options drawer must offer exactly the brands Ypsilon returned for
# the Aer Lingus flight it opens on (Saver, Plus, Advantage on DUB-LHR). Brands in another cabin
# (Aer Space is Premium Economy) are not expected: the drawer only lists the searched cabin.
# The inbound leg is not checked: it only offers the brand picked outbound.

# ADO Test Case ID: 77108
@ado:77108
@regression @flights @ypsilon @provider:ypsilon @branded-fares @pricing-options @aer-lingus @payload @priority:medium
Feature: 77108 Ypsilon - Display all brands in pricing options

  Scenario: All Aer Lingus brands in the Ypsilon Fare response are displayed in pricing options
    Given I am logged in as "ypsilon@brands.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DUB" to "LON"
    Then flight results should be available
    When I filter results by carrier "Aer Lingus"
    Then flight results should be available
    When I click to open first pricing options
    And I wait for the outbound leg in pricing options page
    Then the pricing options brands should match the extFlightInfo brands in the Ypsilon "Fare" responses
