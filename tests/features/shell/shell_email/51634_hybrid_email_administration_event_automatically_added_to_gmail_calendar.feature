# Test Name: Hybrid for 51634 - Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
# Description:
# Status: Active
# Labels: Email,Administration,outlook calendar,hybrid,Regression,UK Parking,Ypsilon,Flights,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-17T11:10:21Z
# Updated: 2025-09-17T12:20:37Z

@regression @shell @administration @itinerary_emails @ypsilon @flights @parking @transportation @full_purchase
Feature: 51634 HYBRID Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
  As a booker whose corporation uses Gmail as its main email provider
  I want the corporate email provider setting to expose Gmail and the trip to book end to end
  So that the itinerary email adds the trip event to the corporate and guest calendars but not to mine

  Scenario: The corporate main email provider offers Gmail and a flight plus parking trip books successfully
    Given I am logged in as "gmail@booker.com" booking a new trip
    When I navigate to the administration page
    Then the corporate main email provider setting should be displayed in the administration
    And the corporate main email provider tooltip should show the title "Select your email provider (e.g., Outlook, Gmail) to ensure that emails containing .ics files are recognized as event invitations and, if supported, automatically added to the recipient's calendar." in the administration
    When I open the corporate main email provider dropdown in the administration
    Then the corporate main email provider option 2 should be visible in the administration as "Gmail"
    And the corporate main email provider dropdown should contain 3 options
    When I close tab 3
    And I have added traveler by name "Grace Calivent"
    And I have added a random guest traveler with email "jeemayleeucer@gmail.com"
    When I search for a one way flight from "LON" to "BCN"
    Then the first flight result should display the Instant Purchase label
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to add parking to my trip from cart
    And I search for UK parking at "London, United Kingdom - Luton APT (LTN)"
    And I wait for add to trip text to be visible
    And I select the first parking filter option
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I fill in UK parking trip details with mobile "31289218", car make "car", model "idk", registration "23423", colour "black", outbound flight "1245", terminal "4", return flight "U2344" and return terminal "7"
    And I accept all Terms & Conditions on the page
    And the booking status should be "Pending booking"
    And I click the proceed to checkout button
    And I complete the booking with Ypsilon credit card verification
    Then the quote status is "Ticketing Complete"
