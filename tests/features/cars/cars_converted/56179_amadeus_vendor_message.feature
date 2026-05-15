@transportation @cars @regression @provider:amadeus
Feature: 56179 - Amadeus Car - Vendor Message Display in Emails

  Scenario: Verify Amadeus vendor message is displayed in booking confirmation emails
    Given I am logged in with an Amadeus car account
    When I search for and book a car
    Then the booking confirmation email should be sent
    And the vendor message should be displayed in the email
