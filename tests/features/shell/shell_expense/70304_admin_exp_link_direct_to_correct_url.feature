@regression @shell @sso @homepage
Feature: 70304 Admin exp link direct to correct URL
  As a corporate user whose company exposes an expenses provider
  I want the expenses entry in the homepage menu to open that provider in a new tab
  So that I can reach my corporate expenses tool from the booking tool

  Scenario: The expenses menu link opens the configured expenses URL in a new tab
    Given I am logged in as "Testim@test.imm"
    Then the homepage menu should display the "vvv" expenses link
    When I open the "vvv" expenses link from the side navigation
    Then the expenses link should open a new tab with the url "https://abc"
