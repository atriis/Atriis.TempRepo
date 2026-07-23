
@regression @provider:bookingcom
Feature: 80264 Booking.com - Genius rates are displayed
  As a corporate traveler using booking.com
  I want to see genius rates for hotels
  So that I can take advantage of discounted pricing

  @priority:high
  Scenario: Genius rates are visible in hotel and room level results
    Given I am logged in as "Geniusrates@bookingtestim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Opul Boutique, Loch Promenade, Douglas, Isle of Man" for 1 night
    And I wait to see view rates text in results page
    Then I should see a tag with the text "GENIUS RATES AVAILABLE" in hotel level results
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then I should see a tag with the text "GENIUS RATE" in room level results
    Then the member rate price should be lower than the regular price
