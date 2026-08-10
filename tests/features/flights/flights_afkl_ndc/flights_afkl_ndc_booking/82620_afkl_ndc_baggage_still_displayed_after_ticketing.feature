# Test Name: 73968 AFKL NDC - Baggage added in Extras is still displayed in Flight Details after ticketing
# Status: Draft
# Labels: Regression,Flights,AFKL,NDC,baggage,Flight Details,Cart,Full Purchase
# Leaves the ticket issued - a ticketed AFKL NDC trip does not cancel through the standard flow.

# ADO Test Case ID: 82620
# ADO workitem ID: 73968
@ado:82620 @regression @flights @afkl @ndc @baggage @full-purchase
Feature: 82620 AFKL NDC - Baggage added in Extras survives ticketing in Flight Details
  As a corporate traveler who paid for baggage on a KLM NDC trip
  I want the baggage to stay listed in Flight Details after the ticket is issued
  So that I can still see what I bought once the booking is complete

  @priority:high
  Scenario: Baggage added to both segments of a MAD-AMS KLM complete trip is listed in Flight Details before and after ticketing
    Given I am logged in as "lastname@x2.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "AMS"
    And flight results should be available
    And I filter results by carrier "KLM"

    # 0PC leaves no baggage in the fare, so anything seen later comes from Extras
    And I select the fare with baggage "0PC" from the first result offering it
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    When I open flight details in cart
    Then the baggage "0PC" should be displayed in flight details
    And I close flight details window

    When I add baggage for outbound and return segments
    Then the baggage green icon should be visible

    # Record whichever option was chosen, so the checks below hold if the supplier's
    # baggage list changes
    When I click to edit the baggage extras section
    And I extract the selected baggage option label

    When I open flight details in cart
    Then the added baggage should be displayed in flight details
    And I close flight details window

    When I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"

    # The cart only re-reads its ancillaries on a full load
    When I refresh the page
    And I open flight details in cart
    Then the added baggage should be displayed in flight details
    And I close flight details window
