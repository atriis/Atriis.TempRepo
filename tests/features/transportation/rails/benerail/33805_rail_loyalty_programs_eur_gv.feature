@regression @benerail @rail_loyalty
Feature: 33805 Rail loyalty programs - EUR and GV
  As a corporate traveler with rail loyalty programs configured
  I want to book a Benerail trip with a specific loyalty number selected
  So that my loyalty number is sent to the supplier during booking

  @priority:critical
  Scenario: Book Benerail with EUR loyalty number (30838145782130000)
    Given I am logged in as "tali@loyal.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlaho"
    And I click proceed button if visible
    And I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    When I expand the loyalty number extras section
    And I open the "Use Existing" tab in the loyalty section
    And I select the loyalty program containing "Club Eurostar"
    Then the existing loyalty card number is "30838145782130000"
    When I click the save button
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I capture the "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" from Storage
    Then the captured "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" should contain the multiline text:
      """
      [{"type":"urn:bnds:ftp_card_types:EUR","number":"30838145782130000"}]
      """

  @priority:critical
  Scenario: Book Benerail with GV loyalty number (29090130838145780)
    Given I am logged in as "tali@loyal.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlaho"
    And I click proceed button if visible
    And I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    When I expand the loyalty number extras section
    And I open the "Use Existing" tab in the loyalty section
    And I select the loyalty program containing "SNCF Voyageur"
    Then the existing loyalty card number is "29090130838145780"
    When I click the save button
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I capture the "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" from Storage
    Then the captured "request" payload for request type "Update Passenger -dialogue-engine/dialogues/passengers PATCH" should contain the multiline text:
      """
      [{"type":"urn:bnds:ftp_card_types:GV","number":"29090130838145780"}]
      """
