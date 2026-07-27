# Test Name: Hybrid for 48270 - Email administration, Add event to Outlook calendar
# Description:
# Status: Active
# Labels: Email,Administration,outlook calendar,hybrid,Evolvi,Rail,Regression,Hotel,Expedia,progress page,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-17T09:43:54Z
# Updated: 2025-09-17T01:42:05Z

@regression @shell @administration @itinerary_emails @evolvi @rails @hotels @expedia @full_purchase
Feature: 48270 Evolvi + Expedia - Email administration, Add event to Outlook calendar
  As a corporate traveler whose corporation uses Outlook as its main email provider
  I want the corporate email provider setting to expose Outlook and the trip to book end to end
  So that the itinerary email can add the trip event to my Outlook calendar

  Scenario: The corporate main email provider offers Outlook and a rail plus hotel trip books successfully
    Given I am logged in as "outlook@event.com" booking a new trip
    When I navigate to the administration page
    Then the corporate main email provider setting should be displayed in the administration
    # TODO: UNCONVERTED Testim step — a 'html-attr-validation' assertion sat here, on the corporate
    # main email provider field, before the dropdown was opened. Testim could not export it, so the
    # attribute and expected value are unknown. Most likely it asserted the currently selected
    # provider is Outlook. Confirm against staging, then add a step such as
    # "the corporate main email provider should be set to {string}".
    When I open the corporate main email provider dropdown in the administration
    Then the corporate main email provider option 1 should be visible in the administration
    And the corporate main email provider dropdown should contain 3 options
    When I close tab 2
    And I book a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I validate and configure split ticket options in Evolvi search
    And I search for a one way Evolvi train from "padToBth"
    # TODO: UNCONVERTED Testim step — a 'negative-element-validation' assertion sat here, right after
    # the Evolvi search was submitted. Testim could not export it, so the element it asserted absent
    # is unknown. Confirm against staging before adding an assertion.
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "Bath Spa" for 1 night 2 months ahead
    And I select the first hotel result
    And I add a refundable room to my cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    When I select default delivery method and save
    And I fill mandatory Evolvi fields in cart
    And I select a reason for non lowest fare in the Evolvi cart
    Then the reason for non lowest fare should be saved in the Evolvi cart
    When I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I wait for booking details in checkout
    And I click book and finalize button
    Then go to trip text is visible
    When I click go to trip button
    Then the trip overview tab should be displayed
    # TODO: MANUAL VERIFICATION NOT PRESENT IN THE TESTIM SOURCE — the test title claims the trip
    # event is added to the Outlook calendar, but the Testim export contains no such assertion; it
    # only verified the administration email-provider setting and that the trip books. Implementing
    # it needs a way to read the itinerary email and assert it carries a calendar invite (ICS
    # attachment / "Add to calendar" action) for the Outlook provider.
