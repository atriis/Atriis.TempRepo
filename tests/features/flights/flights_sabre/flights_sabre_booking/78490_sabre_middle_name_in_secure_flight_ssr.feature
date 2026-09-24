# Test Name: 77258 Sabre - Middle name not sent to DB Secure Flight SSR
# Test Case: 78490
# Status: Active
# Labels: Sabre,Regression,Flights,APIS,Passenger info,hold flight,payload,Cancel by process,2026 plan 2
# Owner: Saar Peleg
# Created: 2026-06-03T00:00:00Z
# Updated: 2026-06-03T00:00:00Z

@regression @flights @sabre @apis @payload @cancel-by-process
Feature: 78490 Sabre - Middle name is sent correctly in DB Secure Flight SSR GivenName field
  As a corporate traveler with a middle name in my profile
  I want my full given name (first + middle) to be sent in the DB Secure Flight SSR
  So that Sabre receives the correct GivenName in the AddApisToPnr request

  # Verifies bug fix for ZD#300789:
  # When a traveler profile includes a middle name, the GetReservation response returns
  # FirstName as "Elijah James Mr" (first + middle + title). The AddApisToPnr request
  # must strip the title and send GivenName = "Elijah James" (first + middle only).
  Scenario: Sabre AddApisToPnr GivenName includes middle name from passenger profile
    Given I am logged in as "middle@name.frosch" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SFO" to "LHR"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    When I capture the "response" payload for request type "GetReservation" from Storage
    Then the captured "response" payload for request type "GetReservation" should contain "ELIJAH JAMES MR".block("Passengers")
    Then the captured "block" payload for request type "GetReservation" should contain "ELIJAH JAMES MR".onKey("FirstName")
    When I capture the "request" payload for request type "AddApisToPnr" from Storage
    Then the captured "request" payload for request type "AddApisToPnr" should contain "Elijah James".block("SecureFlight")
    Then the captured "block" payload for request type "AddApisToPnr" should contain "Elijah James".onKey("GivenName")
    Then I successfully cancel the trip
