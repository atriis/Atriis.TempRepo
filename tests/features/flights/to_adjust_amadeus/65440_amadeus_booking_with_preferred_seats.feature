# Test Name: 65440 Amadeus - Flights - Booking successful with preferred seats
# Status: Active
# Labels: Regression,Flights,Full Purchase,Seating,Amadeus,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-28T03:38:43Z

@regression @amadeus @flights @seating @preferred_seats
Feature: 65440 Amadeus - Booking successful with preferred seats
  As a corporate traveler
  I want to select preferred seats when booking a flight
  So that the booking completes successfully with my preferred seating

  Scenario: Booking a round trip flight with preferred seats selected
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "SEA" to "SBA"
    And I wait for add to trip text to be visible
    And I filter airline results by "Alaska" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 4
    And I click add seats in extras
    And I wait for the seat map to load
    # TODO: then I select a preferred seat (testim code below)
    #// Find all preferred seats
    #const preferredSeats = Array.from(document.querySelectorAll('.plane-seat.preferred'));
#// If any preferred seats exist, pick one at random and click it
#if (preferredSeats.length > 0) {
 # const randomIndex = Math.floor(Math.random() * preferredSeats.length);
  #const selectedSeat = preferredSeats[randomIndex];

  #console.log('Clicking preferred seat:', selectedSeat);
  #selectedSeat.scrollIntoView({ behavior: 'smooth' });
  #selectedSeat.click();
#} else {
 # throw new Error('No preferred seats found.');
#}
 
 #TODO And I click next flight button
 #and reuse the preferred seat selection for the return flight  
  And I save and close seat map drawer

  
