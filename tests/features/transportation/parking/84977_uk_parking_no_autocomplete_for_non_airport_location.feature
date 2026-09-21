# Test Name: 84977 UK Parking - No autocomplete suggestions for a non-airport location
# Description:
# Status: Active
# Labels: UK Parking,Regression,search,Transportation
# Owner: Bruna Santos

@regression @transportation @parking @search
Feature: 84977 UK Parking - No autocomplete suggestions for a non-airport location

  As a corporate traveler
  I want the UK parking location field to offer no suggestions for a place that is not a UK airport
  So that I cannot start a parking search against a location no supplier can serve

  Scenario: No autocomplete suggestions are offered for a non-airport location
    Given I am logged in as "priscilamadalena@ukparkingpris.com" booking a new trip
    When I type "Euston" in UK Parking search location field
    Then no autocomplete suggestions are displayed
