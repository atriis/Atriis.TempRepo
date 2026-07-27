# Test Name: 55667 can't search from cart and search page in case of  locked trip
# Description:
# Status: Active
# Labels: search,Rail,Cart,locked trip,Regression,Pre Prod,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-12-19T10:30:28Z
# Updated: 2025-03-03T05:51:25Z
#
# TEST DATA: user uzi@yonon.com; trip 3377196 is a Confirmed rail booking in the past,
# i.e. a locked / completed trip. The scenario is read-only — it books nothing.

@regression @shell @rails @cart @search @locked-trip
Feature: 55667 - Can't search from cart and search page in case of a locked trip
  As a corporate travel booker
  I want a completed trip to block every way of searching for or adding new products
  So that I start a new trip instead of changing a trip that is already closed

  Scenario: A locked trip offers no way to search for or add new products
    Given I am logged in as "uzi@yonon.com"
    When I navigate to trip 3377196
    Then I should see a quote with status "Confirmed"
    # TODO: Create step 'the add more services section should not be displayed in the trip cart' — assert the cart's "Add more services" section is absent on a locked trip (Testim: negative-element-validation, target NOT exported — confirm against trip-cart.vue:136-139, v-if="!isTripCancelled && !isPreTripApproval && !isTripLocked"). Suggested DSL: Cart.verifyAddMoreServicesSectionNotVisible
    And the add more services section should not be displayed in the trip cart
    # TODO: Create step 'the add product carousel should not be displayed in the trip cart' — assert the add-product carousel is absent on a locked trip (Testim: negative-element-validation, target NOT exported — confirm against <product-carousel class="add-product-list"> in trip-cart.vue:138). Suggested DSL: Cart.verifyAddProductCarouselNotVisible
    And the add product carousel should not be displayed in the trip cart
    # TODO: Create step 'it should not be possible to add a new product from the trip cart' — assert no add-product entry point is reachable on a locked trip (Testim: negative-element-validation, target UNKNOWN — may be a product chip, the per-quote "Check price" button in flight-extra-info.vue:101, or another entry point; if it turns out to duplicate the two assertions above, drop this step). Suggested DSL: Cart.verifyCannotAddProductFromCart
    And it should not be possible to add a new product from the trip cart
    # TODO: Create step 'the locked trip message {string} should be displayed in the trip cart' — assert the locked-trip notice text (Testim selector [class^='pt'] is a Bulma padding utility and is UNUSABLE — read the <app-msg v-if="isTripLocked" iconName="lock"> in trip-cart.vue:23-27, i18n trip.addingProductsLocked + btn.startANewTrip). Suggested DSL: Cart.verifyTripLockedMessage
    And the locked trip message "Adding new products or making changes is no longer possible for completed trips. To add products, please Start a New Trip" should be displayed in the trip cart
    # TODO: Create step 'I navigate to the search page of trip {int}' — open the trip's search page (Cart.navigateToTrip hardcodes /trips/<id>/cart, so it cannot reach it). Suggested DSL: Cart.navigateToTripSearchPage
    When I navigate to the search page of trip 3377196
    # TODO: Create step 'the trip search form should display the {string} trip type option' — assert the trip-type radio label is shown (Testim selector [id='el-id-9447-49'] is an auto-generated Element Plus id and is UNUSABLE — scope .el-radio__label to the trip-search component root and match by visible text). Suggested DSL: Search.verifyTripTypeOptionDisplayed
    Then the trip search form should display the "Round trip" trip type option
    # TODO: Create step 'the search button should not be displayed on the trip search page' — assert the search button is absent on a locked trip (Testim: negative-element-validation, target NOT exported — confirm against trip-search-control.vue:26, .search-btn under v-if="canUseOnlineSearch && !isTripLocked"). Suggested DSL: Search.verifySearchButtonNotVisible
    And the search button should not be displayed on the trip search page
