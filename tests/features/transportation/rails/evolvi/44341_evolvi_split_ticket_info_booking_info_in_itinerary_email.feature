# Test Name: 44341 - Evolvi Split Ticket - Info, booking, info in itinerary email
# Description:
# Status: Active
# Labels: Club,Email,Regression,Rail,Daily Transportation,Full Purchase,Evolvi,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-06-02T09:24:29Z
# Updated: 2026-01-30T02:27:46Z
# The itinerary email content is asserted twice: on the share dialog preview (the same
# backend-generated HTML the mail server sends) and then on the delivered message, read back
# from the test mailbox. The final step needs MAILBOX_* configured in .env — see .env.example.
@transportation @rails @evolvi @regression
Feature: 44341 Evolvi - Split ticket info before and after booking and in itinerary email
  As a corporate traveler
  I want to use split ticket options in Evolvi
  So that split ticket details remain consistent in cart, booking, and itinerary email

  Scenario: Validate split ticket information across search, cart, and itinerary email
    Given I am logged in as "new@rail.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I validate that split ticket options in Evolvi search checkbox is checked
    Then I hover over split ticket info to see the message "SplitTix, or split ticketing, is a practice that allows travellers to save money on UK rail fares by purchasing multiple tickets for a single journey instead of a single, through ticket."
    And I click "Advanced search" in search page
    Then I should select "Split at calling stations" radio button
    Then I hover over split ticket info from "Split at calling stations" to see message "where the traveller may change ticket at a station when train stops, yet they will remain on the train and possibly be required to change seat."
    And I also see message "where the traveller will only change ticket when getting on or off a train." when hover over split ticket info from "Split at calling stations"
    When I search one way Evolvi train from "souToOxf" without unchecking split ticket checkbox
    And I should click info icon next to "SplitTix Available"
    Then I should see message should contain "SplitTix, or split ticketing, is a practice that allows travellers to save money on UK rail fares by purchasing multiple tickets for a single journey instead of a single, through ticket."
    When I hover over the first split ticket fare highlighted in blue
    Then I should see message "SplitTix fare selected - you are purchasing multiple tickets to cover the cost of your journey" for the first split ticket fare highlighted in blue
    And I should see that first split ticket fare highlighted in blue message contaings "Saving of"
    When I select and add to cart the first split ticket fare highlighted in blue
    Then split ticket icon information and "SplitTix" should be visible in cart
    When I click more details in cart
    Then split ticket icon information and "SplitTix" should be visible in more details
    And I select the "eTicket Queue" delivery method and save
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I complete the booking
    Then split ticket icon information and "SplitTix" should be visible in cart
    When I click more details in cart
    Then split ticket icon information and "SplitTix" should be visible in more details
    And I click the share itinerary button
    And I wait to see "Subject" field in share dialog
    Then split ticket icon information, "SplitTix" and "Remain on the train, change ticket" should be visible in itinerary
    And the wallet link "Get your PKPASS (Apple Wallet)" should be visible in itinerary
    And the wallet link "Get your Ticket (Google Wallet)" should be visible in itinerary
    When I add a generated email address as the itinerary recipient
    And I send the email and see success notification
    Then the received itinerary email should contain "SplitTix"
    And the received itinerary email should contain "Get your PKPASS (Apple Wallet)"
    And the received itinerary email should contain "Get your Ticket (Google Wallet)"
    And the received itinerary email should match the itinerary preview
