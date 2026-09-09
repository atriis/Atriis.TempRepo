# Test Name: 59679 Amadeus & Ypsilon - Send pricing request to Amadeus on click Pricing Options
# Description: One way LON-BCN on a mixed Amadeus / Ypsilon account. Filter the results down to
# EasyJet and open the pricing options of the first result: that click must send a pricing request
# to Amadeus, which the trip's distributor request log has to show as an
# Amadeus4.Fare_MasterPricerTravelBoardSearch9 call on top of whatever the search itself sent.
# Status: Active
# Labels: Regression,Flights,Amadeus,Ypsilon,Pricing Options,Payload
# Owner: Bruna Santos

# ADO Test Case ID: 59679
@ado:59679
@regression @flights @ypsilon @pricing-options @payload @priority:high
Feature: 59679 Amadeus & Ypsilon - Pricing request sent to Amadeus on click Pricing Options
  As a corporate traveler on a mixed Amadeus / Ypsilon account
  I want opening the pricing options of an EasyJet result to ask Amadeus to price it
  So that the fares offered in the drawer come from a fresh Amadeus pricing request

  Scenario: Opening the pricing options of an EasyJet result sends a pricing request to Amadeus
    Given I am logged in as "ypsiln@amadeus.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "BCN"
    Then flight results should be available
    When I filter results by carrier "EasyJet"
    Then flight results should be available
    And I click to open first pricing options
    And I wait for the outbound leg in pricing options page
    # The capture step is itself the presence check 
    When I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
