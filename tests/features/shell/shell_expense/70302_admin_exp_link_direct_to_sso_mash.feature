# Test Name: 70302 Admin exp link direct to sso
# Description: The admin-configured expenses provider is Mesh's SSO login page, so the side-nav
#              expenses link must open that exact configured URL in a new tab.
# Source: ADO Test Case 70302 (Plan 83781 / Suite 83909)
# Labels: TESTIM

@regression @shell @sso @homepage @priority:high
Feature: 70302 Admin exp link direct to SSO
  As a corporate user whose company exposes Mesh as its expenses provider over SSO
  I want the expenses entry in the homepage menu to open the Mesh SSO login page
  So that I can reach my corporate expenses tool from the booking tool

  Scenario: The expenses menu link opens the Mesh SSO login URL in a new tab
    Given I am logged in as "Testim@test.im"
    Then the homepage menu should display the "Mesh" expenses link
    When I open the "Mesh" expenses link from the side navigation
    Then the expenses link should land on the url starting with "https://staging.meshpayments.com"
