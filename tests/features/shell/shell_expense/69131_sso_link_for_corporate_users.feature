# Test Name: 69131 [MESH] [OBT] SSO link for corporate users
# Description:
# Status: Active
# Labels: Daily Shell
# Owner: Yael
# Created: 2025-10-21T11:59:18Z
# Updated: 2025-10-21T12:01:57Z

@regression @shell @sso @homepage
Feature: 69131 - SSO link for corporate users
  As a corporate user whose company exposes an expenses provider
  I want the expenses link in the side navigation to sign me in to that provider
  So that I can reach my corporate expenses tool without logging in a second time

  Scenario: The corporate expenses link opens the SSO provider in a new tab
    Given I am logged in as "supp@atriis.com"
    When I open the "MESH" expenses link from the side navigation
    Then the expenses link should open the SSO provider page in a new tab
