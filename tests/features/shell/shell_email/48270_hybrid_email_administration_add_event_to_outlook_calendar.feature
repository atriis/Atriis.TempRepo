# Test Name: Hybrid for 48270 - Email administration, Add event to Outlook calendar
# Description:
# Status: Active
# Labels: Email,Administration,outlook calendar,hybrid,Evolvi,Rail,Regression,Hotel,Expedia,progress page,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-17T09:43:54Z
# Updated: 2025-09-17T01:42:05Z

@regression @shell @administration @itinerary_emails @evolvi @rails @hotels @expedia @full_purchase
Feature: 48270 HYBRID Email administration, Add event to Outlook calendar
  As a corporate traveler whose corporation uses Outlook as its main email provider
  I want the corporate email provider setting to expose Outlook and the trip to book end to end
  So that the itinerary email can add the trip event to my Outlook calendar

  Scenario: The corporate main email provider offers Outlook and a rail plus hotel trip books successfully
    Given I am logged in as "outlook@event.com" booking a new trip
    When I navigate to the administration page
    Then the corporate main email provider setting should be displayed in the administration
    And the corporate main email provider tooltip should show the title "Select your email provider (e.g., Outlook, Gmail) to ensure that emails containing .ics files are recognized as event invitations and, if supported, automatically added to the recipient's calendar." in the administration
    When I open the corporate main email provider dropdown in the administration
    Then the corporate main email provider option 1 should be visible in the administration as "Outlook"
    And the corporate main email provider dropdown should contain 3 options
    When I close tab 3
    And I have added myself as the traveler
    And I search for a one way Evolvi train from "padToBth"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I select default delivery method and save
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "Bath Spa Railway Station, Bath, UK" for 1 night from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart
    And I add a credit card as payment method
    And I fill credit card cvv if needed
    When I accept all Terms & Conditions on the page
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
