# The train information (times, stations, connections, train companies) of both journeys is read
# from the results page Journey Details, then held against the cart Journey Details and the
# delivered itinerary email. The email steps need MAILBOX_* configured in .env — see .env.example.
@transportation @rails @benerail @regression
Feature: 85652 Benerail - Round trip train information matches in results, cart and itinerary email
  As a corporate traveler
  I want the train information of my outbound and inbound journeys to stay the same from results to cart to itinerary email
  So that I can trust the times, stations, connections and train companies I booked

  Scenario: Outbound and inbound train information from results matches the cart and the itinerary email
    Given I am logged in as "pmac@corp.am" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "nltbwToFrpno"
    And I wait for select text to be visible
    And I open journey details for the first Benerail result
    And I extract all train information from the "outbound" journey details in results
    And I close the Benerail journey details panel
    And I select the first Benerail option
    And I wait to see the change button on the selected Benerail leg
    And I open journey details for the first Benerail result
    And I extract all train information from the "inbound" journey details in results
    And I close the Benerail journey details panel
    And I select the first Benerail option for the inbound journey
    And I click Benerail add to trip button
    Then the booking status should be "Pending booking"
    When I click the cart journey details button for the "outbound" journey
    Then all "outbound" train information from cart should match the results
    And I close the Benerail journey details panel
    When I click the cart journey details button for the "inbound" journey
    Then all "inbound" train information from cart should match the results
    And I close the Benerail journey details panel
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "In progress"
    When I click the share itinerary button
    And I add a generated email address as the itinerary recipient
    And I send the email and see success notification
    Then the received itinerary email should contain all "outbound" train information from results
    And the received itinerary email should contain all "inbound" train information from results
