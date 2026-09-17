# Test Name: 29785 MERGED Copy Trip - Products eligible for copy - flight hotel and car + Prevent updating personal information
# Description: if the user has the role: Prevent updating others and own profile, then data entered in the trip does not updated in the administration
# Status: Active
# Labels: Role,Administration,Frequent flyer,Hotel loyalty number,Car loyalty number,passport,GDS,Hotel,Cars,Flights,No Amadeus Hotel Book,Regression,Copy Trip,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T06:16:39Z
# Updated: 2025-05-27T10:26:28Z

@regression @shell @copy-trip @flights @hotel @cars @administration
Feature: 29785 - Copy trip with eligible products and prevent updating personal information
  As a corporate traveler with the "prevent updating others and own profile" role
  I want to copy a trip containing a flight, hotel and car with loyalty and passport details
  So that the copied trip keeps the products while the personal details are not saved to the administration

  Scenario: Copy a flight, hotel and car trip and confirm personal details are not persisted to administration
    Given I am logged in as "Amy@Gadasy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "NYC"
    And I click proceed button if visible
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "LHR" for 1 night from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart
    When I click to add a car to my trip from cart
    And I search for a car with 1 months ahead from the cart drawer
    And I add the first car to cart
    And the booking status should be "Pending booking"
    # Capture the three products on the original trip so the copy can be compared against them 
    When I store the first booked flight number
    And I extract the hotel name from cart
    And I store the car type from the cart
    # Add loyalty numbers, passport and frequent flyer via the cart quote extras 
    When I add a hotel loyalty number "123456" in the quote extras
    When I click passenger info in extras
    And I fill in the passport number "456789" in passenger info section
    And I fill in the nationality in passenger info section with "netherlands"
    And I fill in the passport expiry date "03 May 2030" in passenger info section
    And I save the passenger info
    When I click frequent flyer in extras
    And I add loyalty number "789654" using airline "JetBlue"
    When I add a car driver loyalty number "854712" in the extras
    # Copy the trip 
    When I open the copy trip dialog
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    And all products in the copy trip dialog should show status "Pending Booking"
    # Validate the copied trip contents. The copy opens in a new browser tab; each "copied trip"
    # step addresses that tab itself, so the administration checks below stay on this trip's tab.
    When I confirm the copy trip
    Then the trip is created successfully with the same flight
    And the copied trip should contain the same hotel
    And the copied trip should contain the same car
    # Validate personal details were NOT saved to the administration
    When I navigate to the administration page
    And I open the Users tab in the administration
    And I search for user "Amy Gadasy" in the administration
    And I open the first user in the administration users list
    And I open the passports and visas tab in the administration
    Then the passport section should be empty in the administration
    When I open the frequent flyer tab in the administration
    Then the frequent flyer number "789654" should not be saved in the administration
    And the car loyalty number "854712" should not be saved in the administration
