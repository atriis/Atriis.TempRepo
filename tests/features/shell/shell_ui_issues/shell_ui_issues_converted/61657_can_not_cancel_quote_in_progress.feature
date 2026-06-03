# Test Name: 61657 Can not cancel quote 'In Progress'
# Description:
# Status: Active
# Labels: Daily Shell,Regression,trip cancelation,2026 plan 2
# Owner: Yael
# Created: 2025-05-06T01:38:15Z
# Updated: 2026-02-11T02:49:14Z

@regression @shell @trip-cancellation
Feature: 61657 - Can not cancel quote 'In Progress'
  As a corporate travel booker
  I want to verify that a trip cannot be canceled while a quote is in progress
  So that the system protects in-flight bookings from accidental cancellation

  Scenario: Trip cancellation is blocked when a quote is In Progress and individual items can still be canceled
    Given I am logged in as "inprogress@inprogress.com"
    When I navigate to trip 3520979
    # TODO: click on the passengers section of the trip — no existing step covers page.click(".passengers")
    #       Proposed step: When I open the passengers panel
    #       DSL method: Cart.openPassengersPanel(page) — clicks ".passengers"
    Then I should see a quote with status "In progress"
    # TODO: hover the trip-level three-dots actions menu to open it — no existing step covers page.hover("#el-id-5854-13 > span")
    #       Proposed step: When I hover the trip actions menu
    #       DSL method: Cart.hoverTripActionsMenu(page) — hovers ".quote-payment-card .expand-icon" or equivalent
    # TODO: verify "Copy trip" option is visible in the trip actions dropdown — no existing step covers waitForText(page, "#el-id-286-13 > li:nth-child(2)", 'Copy trip')
    #       Proposed step: Then the trip actions menu should show "Copy trip"
    #       DSL method: Cart.verifyTripActionMenuOptionVisible(page, 'Copy trip')
    # TODO: hover the quote expand icon to open the cancellation tooltip — no existing step covers page.hover("[id='el-id-8202-14'] .expand-icon")
    #       Proposed step: When I hover the quote expand icon
    #       DSL method: Cart.hoverQuoteExpandIcon(page) — hovers "[id='el-id-8202-14'] .expand-icon"
    # TODO: verify the tooltip text "Trip cannot be canceled while you have products in progress or finalizing." is displayed — no existing step covers waitForText(page, "#el-id-2886-71 > span:nth-child(1)", 'Trip cannot be canceled while you have products in progress or finalizing.')
    #       Proposed step: Then the cancel trip tooltip should say "Trip cannot be canceled while you have products in progress or finalizing."
    #       DSL method: Cart.verifyCancelTripTooltipText(page, expectedText) — waits for text in the tooltip element
    Then the cancel trip button should be disabled
    # TODO: hover the item-level three-dots actions menu to open it — no existing step covers page.hover("#el-id-5854-61")
    #       Proposed step: When I hover the item actions menu
    #       DSL method: Cart.hoverItemActionsMenu(page) — hovers the item-level expand/actions icon
    # TODO: verify "Cancel item" option is visible in the item actions dropdown — no existing step covers waitForText(page, "#el-id-2159-62 > li > span.mr-2", 'Cancel item')
    #       Proposed step: Then the item actions menu should show "Cancel item"
    #       DSL method: Cart.verifyItemActionMenuOptionVisible(page, 'Cancel item')
    # TODO: hover the trip-level three-dots actions menu again — no existing step covers page.hover("#el-id-5854-13 > span")
    #       Proposed step: When I hover the trip actions menu
    # TODO: verify "Copy trip" option is still visible in the trip actions dropdown — no existing step covers waitForText(page, "#el-id-286-13 > li:nth-child(2)", 'Copy trip')
    #       Proposed step: Then the trip actions menu should show "Copy trip"
    # TODO: click the "Cancel item" option for the first item — no existing step covers page.click("#el-id-9411-16 > li:nth-child(3) > span.mr-2")
    #       Proposed step: When I cancel the first item from the item actions menu
    #       DSL method: Cart.clickCancelItemFromActionsMenu(page, 0) — clicks the Cancel item option in item dropdown
    # TODO: 'negative-element-validation' step — manually verify that trip cancel is still blocked after canceling first item
    #       Proposed step: Then the cancel trip button should be disabled
    # TODO: hover the item-level three-dots actions menu again — no existing step covers page.hover("#el-id-5854-61")
    #       Proposed step: When I hover the item actions menu
    # TODO: verify "Cancel item" option is still visible in the item actions dropdown — no existing step covers waitForText(page, "#el-id-2159-62 > li > span.mr-2", 'Cancel item')
    #       Proposed step: Then the item actions menu should show "Cancel item"
    # TODO: click the "Cancel item" option for the second item — no existing step covers page.click("#el-id-2272-63 > li > span.mr-2")
    #       Proposed step: When I cancel the second item from the item actions menu
    #       DSL method: Cart.clickCancelItemFromActionsMenu(page, 1)
    # TODO: 'negative-element-validation' step — manually verify the expected post-cancellation state (e.g., trip can now be canceled or items are removed)
    #       Proposed step: Then the cancel trip button should be disabled (or enabled — must be verified manually in UI)
