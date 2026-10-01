# Test Name: 85688 travel policy - hotel dynamic lowest fare
# Description: The travel policy of testim@hotellowestfare.com marks a hotel out of policy when its price is at least 100 USD above the hotel dynamic lowest fare, which is the average price of the 3-4 star hotels within 1.1 km of the searched location, measured on the exact distance. The out of policy indicator must appear on exactly the hotels and rooms priced at or above that price, and the cart must carry it once such a room is added.
# Status: Design
# Labels: Hotel,Regression,Travel policy,Dynamic lowest fare,OOP
# Owner: Shani Hadar

# ADO Test Case ID: 85688
@ado:85688
@regression @hotels @provider:general
Feature: 85688 Hotels - Travel policy hotel dynamic lowest fare
  As a corporate traveler subject to a hotel lowest fare travel policy
  I want the out of policy indicators to follow the dynamic lowest fare of my search
  So that I can tell which hotels and rooms exceed the policy before I book

  @priority:high
  Scenario: Out of policy indicators follow the hotel dynamic lowest fare in results and cart
    Given I am logged in as "testim@hotellowestfare.com" booking a new trip
    And I have added myself as the traveler
    # The dynamic lowest fare is calculated from the search response, which arrives once —
    # so it must be listened for before the search is submitted.
    And I capture the hotel search results
    When I search for a hotel in "Paris France" for 1 night
    And I wait to see view rates text in results page
    And I calculate the hotel out of policy price from the dynamic lowest fare of 3-4 star hotels within 1.1 km plus 100
    Then only the hotels priced at or above the lowest fare out of policy price should be out of policy
    Then the out of policy tooltip in hotel results should quote the hotel lowest fare margin
    When I select the most expensive in policy hotel
    # The filter panel is built from the loaded room set, so it only appears once every room
    # has rendered — waiting for it stops the checks below reading a partial room list.
    And I see room level filter sections
    Then only the rooms priced at or above the lowest fare out of policy price should be out of policy
    Then the out of policy tooltip in room level results should quote the hotel lowest fare margin
    When I add the first out of policy room to my cart
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should be visible in cart
    Then the out of policy tooltip in cart should quote the hotel lowest fare margin
