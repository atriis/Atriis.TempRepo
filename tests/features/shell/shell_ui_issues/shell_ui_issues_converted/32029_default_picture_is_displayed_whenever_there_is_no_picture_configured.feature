# Test Name: 32029 Default picture is displayed whenever there is no picture configured
# Description:
# Status: Active
# Labels: Regression,Quick Links,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-16T09:18:18Z
# Updated: 2023-06-16T09:26:24Z

@regression @shell @ui_issues @quick_links
Feature: 32029 - Default picture is displayed whenever there is no picture configured
  As a corporate travel user
  I want to see a default picture on a quick link product when no picture is configured
  So that the homepage product card always renders a meaningful image

  Scenario: Default picture is shown for a quick link product without a configured picture
    Given I am logged in as "testim@Quick.link"
    #TODO When I hover over the quick link product card on the homepage
    #TODO Then the default product picture should be displayed on the quick link card - check the html to see the default picture. we need to make sure we are validating the picture here
