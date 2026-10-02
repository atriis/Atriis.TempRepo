@transportation @cars @regression @provider:galileo
Feature: 55133 Galileo - dynamic field send as remark with traveler connection

  Scenario: Dynamic fields are filled and sent as remarks with traveler connection
    Given I am logged in as "rafael@dinmark.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "rafi din"
    When I initiate a car search at "LHR" with rental agency "Avis"
    And I click proceed button if visible
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I click to edit the driver/loyalty id extras section
    And I select "Rafael Dinmark" as the driver
    And I click the save button
    Then I should see a success notification
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the reference field values are:
    | 7878 |
    | htht |
    When I complete the booking
    Then the booking status should be "Confirmed"
    # The remarks are written by a follow-up UniversalRecordModifyReq a few seconds after the
    # booking confirms, so they are checked after the cancellation has given that call time to land
    And I successfully cancel the trip
    # Each traveler's dynamic field answer is sent to Galileo as a remark tied to that traveler
    When I capture the "request" payload for request type "UniversalRecordModifyReq" from Storage
    Then the captured "request" payload for request type "UniversalRecordModifyReq" should contain "DCY/7878/P1"
    And the captured "request" payload for request type "UniversalRecordModifyReq" should contain "DCY/HTHT/P2"
