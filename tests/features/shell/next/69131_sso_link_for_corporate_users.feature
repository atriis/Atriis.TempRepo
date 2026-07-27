# Test Name: 69131 [MESH] [OBT] SSO link for corporate users
# Description:
# Status: Active
# Labels: Daily Shell
# Owner: Yael
# Created: 2025-10-21T11:59:18Z
# Updated: 2025-10-21T12:01:57Z
# Testim source: tests/testim/active/regression_set_new_front/shell/general/69131_[mesh]_[obt]_sso_link_for_corporate_users.js

@regression @shell @sso @homepage
Feature: 69131 - SSO link for corporate users
  As a corporate user whose company exposes an expenses provider
  I want the expenses link in the side navigation to sign me in to that provider
  So that I can reach my corporate expenses tool without logging in a second time

  Scenario: The corporate expenses link opens the SSO provider in a new tab
    Given I am logged in as "supp@atriis.com"
    # TODO: create step "I open the {string} expenses link from the side navigation" in tests/steps/app.steps.js
    # covers: page.click(".top-container > :nth-child(7) .icon-container > :nth-child(2)")
    # DSL: Homepage.openExpensesLinkFromSideNav (NEW, src/dsl/Homepage.js) backed by a new atomic action in src/pages/HomePage.js
    # ".top-container" is the LEFT SIDE-NAV (Atriis.App/src/app/Atriis.OBT/src/components/app-side-nav/app-side-nav.vue),
    #   NOT a header. Its children are v-if gated by permissions (isReportAllowed / isShowCareDashboard / isShowQlink),
    #   so the recorded :nth-child(7) resolves PER USER and must NOT be ported. Anchor instead on the
    #   "account_balance_wallet" material icon or on the label text.
    # The rendered label is "<expenseDisplayName> - Expenses"; the {string} parameter is the corporate expense
    #   display name ("MESH").
    # Clicking fires expenseRedirect() -> utilService.openNewWindow(false, this.expense.Url, '_blank')
    #   (app-side-nav.ts:124-149) => it OPENS A NEW BROWSER TAB. Capture it with context.waitForEvent('page') armed
    #   BEFORE the click (mirror the existing Homepage.openProductFromHomepage pattern); do NOT use waitForURL on
    #   the original page.
    # Deployed staging can lag the Atriis.App source — verify the live DOM before finalising selectors.
    When I open the "MESH" expenses link from the side navigation
    # TODO: create step "the expenses link should open the SSO provider page in a new tab" in tests/steps/app.steps.js
    # ADDED assertion — this step corresponds to NO recorded action: the Testim source has ZERO assertions, so the
    #   recorded test could never fail on the behaviour in its own title. This step is what makes the test meaningful.
    # DSL: Homepage.verifyExpensesSsoTabOpened (NEW, src/dsl/Homepage.js)
    # expense.Url comes from userService.getUserExpense(corporationId) and is prefixed with config.expenseUrl when
    #   relative => it is CONFIG/CORPORATION dependent. Any URL assertion must compare against the link's OWN href /
    #   config.expenseUrl, NEVER a hardcoded provider domain.
    # Afterwards close the SSO tab and bringToFront() the app page, per the established new-tab hyperlink pattern in
    #   this repo.
    # Catalog reuse was CONSIDERED and REJECTED: the existing "a new tab should have been opened" step
    #   (tests/steps/results.steps.js:59) reads this.newTabPage, which is only ever set by the conflicting-quote-modal
    #   step — reusing it would assert nothing about the SSO target.
    Then the expenses link should open the SSO provider page in a new tab
