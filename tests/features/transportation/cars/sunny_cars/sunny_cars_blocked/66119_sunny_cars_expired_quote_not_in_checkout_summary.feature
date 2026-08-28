# Test Name: 66119 Sunny Cars - Expired quote is not displayed in checkout summary
# Description:
# Status: Active
# Labels: Cars,Expiry,Checkout,SunnyCars Regression,2026 plan 2,02
# Owner: Bruna Santos
# Created: 2025-08-28T02:44:33Z
# Updated: 2025-12-17T08:42:36Z
# Converted from: tests/testim/active/regression_set_new_front/transportation/cars/66119_sunny_cars_expired_quote_is_not_displayed_in_checkout_summary.js

@transportation @cars @regression @provider:sunnycars @expiry @checkout @ado:66119
Feature: 66119 Sunny Cars - Expired quote is not displayed in the checkout summary

  As a Sunny Cars traveler with an already-expired car quote in a trip
  I want the checkout summary to price only the still-valid quote
  So that an expired quote is never carried into the booking total

  @priority:high
  Scenario: Checkout summary prices only the pending booking quote and leaves the expired quote out
    Given I am logged in as "kaylesun@tlcfaketestsunnycar.com"
    When I navigate to the trips page
    And I search the trips page for "3536678"
    Then the trips search should offer to expand the search
    When I expand the trips search
    Then the trip with id "3536678" should be displayed in the results
    When I click the first trip from the trip list
    Then the trip title should contain "Trip To Palma De Majorca"
    And the booking status should be "Expired"
    # TODO: implement "I search for a car at {string} with {int} months ahead from the cart drawer"
    # — the cart drawer opened by the Car carousel tile must take a NEW pick-up location AND new
    # rental dates (the trip's own dates belong to the expired quote). Testim raw actions:
    # type "Barcelona Intl. (BCN),Barcelona, Spain" into the location autocomplete + click
    # "[id*='id'] .has-text-weight-bold" suggestion; click pick-up date field, click
    # "[aria-label='Next Month']", pick "tbody > :nth-child(3) > td:nth-of-type(3)"; click
    # drop-off date field, pick "tbody > :nth-child(4) > td:nth-of-type(5)"; click ".btn--size-large".
    When I click to add a car to my trip from cart
    And I search for a car at "BCN" with 1 months ahead from the cart drawer
    And I add the first car to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    And I fill in the OOP justification text "abc"
    And I proceed to checkout
    Then the "Hire a car at Barcelona Intl. (BCN),Barcelona, Spain" quote should be visible in the checkout summary
    # TODO: implement "the checkout summary should list {int} quote(s)" — count the VISIBLE
    # ".quote-icon" elements in the checkout summary; exactly 1 proves the expired quote is not
    # priced alongside the pending booking quote (this is the assertion the test exists for).
    And the checkout summary should list 1 quote(s)
    When I navigate to cart from checkout
    Then the booking status should be "Pending booking"
    When I hover the item actions menu
    Then the item actions menu should show "Cancel item"
    # TODO: implement "I successfully cancel the {string} quote from the item actions menu" —
    # cancel ONLY the pending booking quote, scoped by quote title, and assert the success
    # message. Testim raw actions: click "#el-id-8246-789 > li > span" ("Cancel item"); assert
    # "[aria-label='Cancel item - <title>'] .btn--primary" reads "Cancel item"; dblclick
    # "[aria-label*='Cancel item'] .btn--primary"; assert ".quote-details > :nth-child(2) p"
    # reads "Cancelled successfully"; click ".close-btn".
    When I successfully cancel the "Hire a car at Barcelona Intl. (BCN),Barcelona, Spain" quote from the item actions menu
