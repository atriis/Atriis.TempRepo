@flights @provider:amadeus @regression @fare-rules @payload
Feature: 85655 Amadeus - Fare rules retrieved by ticketing date for ticketed PNRs
  As a traveler opening an already-ticketed Amadeus trip
  I want the post-ticketing fare rules request to carry the date of ticketing
  So that the fare rules shown are the ones that applied when the ticket was issued
  # ADO workitem Id(s) - 85277 (user story), TC 85655
  # Trip 3901506 was ticketed on 29/9/2026, so the DO date below is that fixed ticketing date.
  # Its flights depart July 2027: after that it leaves "Upcoming trips" and the test needs a
  # freshly ticketed trip, with its id and ticketing date swapped in here.

  @priority:high
  Scenario: Fare rules opened from a ticketed trip send the DO date in the informative pricing request
    Given I am logged in as "dayoftkt@farerules.ams"
    When I navigate to the trips page
    And I select the "Upcoming trips" quick view on the trips page
    Then the trip with id "3901506" should be listed on the trips page
    When I open the trip with id "3901506" from the trips page
    And I store the current trip number for payload validation
    And I note the time before new payload requests are sent
    And I click to open fare rules in cart
    And I capture the latest "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR (Post Ticketing)" sent since the noted time from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR (Post Ticketing)" should contain "DO".block("dateInformation")
    And the captured "block" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR (Post Ticketing)" should contain "2026".onKey("year")
    And the captured "block" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR (Post Ticketing)" should contain "9".onKey("month")
    And the captured "block" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR (Post Ticketing)" should contain "29".onKey("day")
