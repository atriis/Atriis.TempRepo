# ADO Test Case ID: 57202
@ado:57202
@transportation @rails @benerail @regression @hybrid
Feature: 57202 HYBRID Benerail Moove - Update pax details before booking
  As a corporate user booking Benerail for myself, a colleague and a guest
  I want every passenger's details sent to Benerail when the dialogue starts and again before booking
  So that the booked tickets carry the right passenger data

  # HYBRID: the last expected result of the test case — the booking email is sent as set in
  # tmc NL gov > corp Benerail Moove > Web Confirmations > Booked by Corporate User — stays a
  # manual check. That email goes to the passengers' own addresses, which no test can read.
  Scenario: Benerail sends all three passengers on addPassenger and on Update Passenger at booking
    Given I am logged in as "pini@bene.ral" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Pinibene Old"
    And I have added a random guest traveler with name "Guestbene" "Moovetest"
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I wait for select text to be visible
    Then exactly 3 "addPassenger -dialogue-engine/dialogues/passengers POST" requests should have been sent
    When I capture the "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" from Storage
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "\"firstName\":\"Pini\",\"lastName\":\"Bene Garcia\""
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "\"firstName\":\"Pinibene\",\"lastName\":\"Old\""
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "\"firstName\":\"Guestbene\",\"lastName\":\"Moovetest\""
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then exactly 3 "Update Passenger -dialogue-engine/dialogues/passengers PATCH" requests should have been sent
    When I capture the "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" from Storage
    Then the captured "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" should contain "\"firstName\":\"Pini\",\"lastName\":\"Bene Garcia\""
    And the captured "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" should contain "\"firstName\":\"Pinibene\",\"lastName\":\"Old\""
    And the captured "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" should contain "\"firstName\":\"Guestbene\",\"lastName\":\"Moovetest\""
