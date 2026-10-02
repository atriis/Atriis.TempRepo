# Test Name: 69689 Fusion - Taxes not added as additional charges in confirmation email
# Status: Active
# Labels: Regression,Fusion,EasyJet,Flights,Full Purchase,Email
# Owner: Bruna Santos
# Created: 2025-11-02T12:15:08Z

# ADO Test Case ID: 69689
# Source: ADO Bug #68984 - Fusion - Taxes added as additional charge on e-ticket confirmation email
#
# The "Preparing Itinerary notification" mail is sent automatically after booking, to the TRAVELLER's
# profile email, so it cannot be redirected to an address the test generates. The traveller
# "Carlos Marcelo" exists in staging for this test only: its profile email is the reserved test
# mailbox atriis-qa@mailsac.com, which tests/steps/email.steps.js reads through the Mailsac API.

@regression @flights @fusion @easyjet @full-purchase @email @lcc
Feature: 69689 Fusion - Taxes not added as additional charges in confirmation email
  As a traveller booking a Fusion EasyJet flight
  I want the e-ticket confirmation email to show the taxes only once
  So that the price breakdown in the email matches what I paid

  Scenario: Fusion EasyJet e-ticket confirmation email has no additional charges in the price breakdown
    Given I am logged in as "carlosmarcelo@amsalembrunafusion.com" booking a new trip
    And I have added myself as the traveler 
    When I search for a one way flight from "LGW" to "MXP"
    Then flight results should be available
    When I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking with Fusion credit card verification
    Then the ticket details should be visible after booking
    And the "Preparing Itinerary notification" email for this trip should be received at "atriis-qa@mailsac.com"
    And the price breakdown in the received e-ticket confirmation email should not include additional charges
