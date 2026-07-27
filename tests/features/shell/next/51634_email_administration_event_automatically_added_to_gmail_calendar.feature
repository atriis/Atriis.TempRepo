# Test Name: Hybrid for 51634 - Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
# Description:
# Status: Active
# Labels: Email,Administration,outlook calendar,hybrid,Regression,UK Parking,Ypsilon,Flights,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-17T11:10:21Z
# Updated: 2025-09-17T12:20:37Z

@regression @shell @administration @itinerary_emails @ypsilon @flights @parking @transportation @full_purchase
Feature: 51634 Ypsilon + UK Parking - Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
  As a booker whose corporation uses Gmail as its main email provider
  I want the corporate email provider setting to expose Gmail and the trip to book end to end
  So that the itinerary email adds the trip event to the corporate and guest calendars but not to mine

  Scenario: The corporate main email provider offers Gmail and a flight plus parking trip books successfully
    Given I am logged in as "gmail@booker.com" booking a new trip
    When I navigate to the administration page
    Then the corporate main email provider setting should be displayed in the administration
    # TODO: UNCONVERTED Testim step — a 'html-attr-validation' assertion sat here, on the corporate
    # main email provider field, before the dropdown was opened. Testim could not export it, so the
    # attribute and expected value are unknown. Most likely it asserted the currently selected
    # provider is Gmail. Confirm against staging, then add a step such as
    # "the corporate main email provider should be set to {string}".
    When I open the corporate main email provider dropdown in the administration
    Then the corporate main email provider option 2 should be visible in the administration
    And the corporate main email provider dropdown should contain 3 options
    When I close tab 2
    And I book a new trip
    And I have added traveler by name "Grace Calivent"
    # TODO: the Testim source created the guest with the fixed address "jeemayleeucer@gmail.com".
    # The reused step randomises the guest email. That only matters for the Gmail-calendar
    # verification below — if that check is implemented, add a guest step that accepts an email.
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "BCN"
    Then the first flight result should display the Instant Purchase label
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I click to add parking to my trip from cart
    And I search for UK parking at "LHR"
    And I wait for add to trip text to be visible
    And I select the first parking filter option
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I fill in UK parking trip details with mobile "31289218", car make "car", model "idk", registration "23423", colour "black", outbound flight "1245", terminal "4", return flight "U2344" and return terminal "7"
    And I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I complete the booking with Ypsilon credit card verification
    And I click go to trip button
    Then the quote status is "Ticketing Complete"
    # TODO: MANUAL VERIFICATION NOT PRESENT IN THE TESTIM SOURCE — the test title claims the trip
    # event is added automatically to the Gmail calendar of the corporate traveller and the guest
    # but NOT of the booker. The Testim export contains no such assertion; it only verified the
    # administration email-provider setting and that the trip books. Implementing it needs a way to
    # read each recipient's itinerary email and assert the calendar invite is present for the
    # traveller and guest and absent for the booker.
