# Test Name: 43997 can look but not book
# Description:
# Status: Active
# Labels: Regression,Role,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-03-26T12:41:47Z
# Updated: 2024-09-24T06:29:58Z

@regression @shell @roles @privileges @hotels
Feature: 43997 - can look but not book
  As a user whose role only permits browsing (not booking)
  I want the application to prevent me from adding other travelers and from finalizing a booking
  So that I can look at availability but must share the quote with a Booker to complete it

  Scenario: Look-but-not-book user cannot add travelers and is blocked from booking a hotel at checkout
    Given I am logged in as "luk@notbuk.com" booking a new trip
    Then the traveler name "Luk Notbuk" should be visible in the travelers list
    And it should not be possible to add more travelers
    When I initiate a hotel search in "LON" for 1 night
    And I fill in NL reference fields education and courses
    And I select the first hotel result
    And I filter room results by refundable
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    # TODO: assert the checkout payment form shows the role-restriction error (source waits on ".form-payment-err" text) — back with Cart.verifyRoleRestrictionMessage (new): read the ".form-payment-err" element text
    And the checkout should display the role restriction message "*Your role does not allow to make bookings. Share the quote with a user with Booker rights to finalize it"
    When I accept Terms & Conditions
