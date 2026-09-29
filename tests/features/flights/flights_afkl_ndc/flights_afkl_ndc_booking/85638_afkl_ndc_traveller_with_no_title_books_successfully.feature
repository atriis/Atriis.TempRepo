# Test Name: 85638 AFKL NDC - Traveller with no title books successfully (title derived from gender)
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Hold,Traveler Title
# Owner: Yael Alef

# ADO Test Case ID: 85638
# ADO workitem ID: 85497
@ado:85638 @regression @flights @afkl @ndc @hold @priority:high @provider:afkl
Feature: 85638 AFKL NDC - Traveller with no title books successfully (title derived from gender)
  As a corporate traveler whose profile has no title
  I want my AFKL NDC booking to go through
  So that the title is derived from my gender instead of the booking failing

  Scenario: No-title male traveller holds a KL NDC round trip and OrderCreate carries TitleName MR
    Given I am logged in as "yael@atriis.com" booking a new trip
    And I have added traveler by name "will never"
    When I search for a round trip flight from "AMS" to "GRU"
    And flight results should be available
    And I filter results by carrier "kl"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I capture the "request" payload for request type "OrderCreateV01 (Booking)" from Storage
    Then the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "<TitleName>MR</TitleName>"
    Then I successfully cancel the trip
