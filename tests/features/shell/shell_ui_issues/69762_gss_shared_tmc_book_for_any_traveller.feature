@regression @flights @amadeus @tmc @ado:69182 @ado:69762
Feature: 69762 [GSS] Corporate user should be able to book for any traveller 
  As a corporate booker in a shared TMC
  I want to open a trip for a traveller who sits under a different corporate
  So the trip can be taken through to checkout

  @priority:high
  Scenario: GSS shared TMC corporate user can book
    Given I am logged in as "gss@corp.com" booking a new trip
    And I have added traveler by name "main@gss.com"
    When I search for a one way flight from "LHR" to "MEX"
    Then flight results should be available
    And I filter results by carrier "Iberia"
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
