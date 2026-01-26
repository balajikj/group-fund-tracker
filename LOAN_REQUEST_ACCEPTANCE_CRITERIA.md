# 🧪 Loan Request Feature - Acceptance Criteria (Gherkin)

## Feature: Member Loan Request Submission

```gherkin
Feature: Member Loan Request Submission
  As a Member
  I want to request a loan
  So that I can get financial assistance from the group fund

  Background:
    Given I am logged in as a Member
    And my lifetime contribution is ₹12,000
    And I have ₹0 outstanding loans
    And the lending budget is ₹50,000

  Scenario: Successfully submit a valid loan request
    When I click "Request Loan" button
    And I enter amount "5000"
    And I select due date "30 days from today"
    And I enter comments "Medical emergency"
    And I click "Submit Loan Request"
    Then the request should be created with status "Pending"
    And I should see success message "Loan request submitted successfully! Awaiting Admin approval."
    And the request should appear in "My Loan Requests" table
    And the status badge should be yellow with "🟡 Pending"

  Scenario: Validation - Amount too low
    When I am on the "Request Loan" form
    And I enter amount "50"
    And I click "Submit Loan Request"
    Then I should see error "Amount must be between ₹100 and ₹100,000"
    And the request should not be submitted

  Scenario: Validation - Amount too high
    When I am on the "Request Loan" form
    And I enter amount "150000"
    And I click "Submit Loan Request"
    Then I should see error "Amount must be between ₹100 and ₹100,000"
    And the request should not be submitted

  Scenario: Validation - Due date too soon
    When I am on the "Request Loan" form
    And I enter amount "5000"
    And I select due date "5 days from today"
    And I click "Submit Loan Request"
    Then I should see error "Due date must be 7-180 days from today"
    And the request should not be submitted

  Scenario: Validation - Due date too far
    When I am on the "Request Loan" form
    And I enter amount "5000"
    And I select due date "200 days from today"
    And I click "Submit Loan Request"
    Then I should see error "Due date must be 7-180 days from today"
    And the request should not be submitted

  Scenario: Validation - Exceeds member outstanding limit
    Given I have ₹190,000 outstanding loans
    When I request a loan of "₹20,000"
    Then I should see error "Your total outstanding would exceed ₹200,000"
    And the request should not be submitted

  Scenario: Validation - Exceeds lending budget
    Given the lending budget is ₹1,000
    When I request a loan of "₹2,000"
    Then I should see error "Requested amount exceeds available lending budget of ₹1,000"
    And the request should not be submitted

  Scenario: View request history with all statuses
    Given I have submitted the following loan requests:
      | Request Date | Amount  | Status   |
      | Jan 20, 2026 | ₹5,000  | Pending  |
      | Jan 15, 2026 | ₹3,000  | Approved |
      | Jan 10, 2026 | ₹10,000 | Rejected |
    When I view "My Loan Requests" panel
    Then I should see 3 loan requests
    And the first request should show status "🟡 Pending"
    And the second request should show status "✅ Approved"
    And the third request should show status "❌ Rejected"

  Scenario: Cancel pending loan request
    Given I have a pending loan request for ₹5,000
    When I click "Cancel" button on the request
    And I confirm the cancellation
    Then the request should be deleted
    And I should see success message "Loan request cancelled successfully."
    And the request should no longer appear in "My Loan Requests"

  Scenario: Cannot cancel approved loan request
    Given I have an approved loan request for ₹5,000
    When I view "My Loan Requests" panel
    Then I should not see a "Cancel" button for the approved request
```

---

## Feature: Admin Loan Request Review

```gherkin
Feature: Admin Loan Request Review
  As an Admin
  I want to review and approve/reject loan requests
  So that I can manage loan disbursements responsibly

  Background:
    Given I am logged in as Admin
    And the lending budget is ₹50,000

  Scenario: View pending loan requests queue
    Given there are 3 pending loan requests:
      | Member   | Amount  | Due Date | Reason         |
      | John Doe | ₹5,000  | Feb 25   | Medical        |
      | Jane Doe | ₹8,000  | Mar 15   | Education      |
      | Bob Doe  | ₹3,000  | Feb 10   | Car repair     |
    When I view the "Pending Loan Requests" panel
    Then I should see 3 pending requests
    And each request should show member's contribution
    And each request should show member's current outstanding
    And each request should have a "Review" button

  Scenario: Approve loan request as-is
    Given there is a pending loan request:
      | Member   | Amount | Due Date | Reason          |
      | John Doe | ₹5,000 | Feb 25   | Medical expense |
    And John Doe's lifetime contribution is ₹12,000
    And John Doe has ₹0 outstanding loans
    When I click "Review" on the request
    And I click "Approve & Disburse"
    Then the request status should change to "Approved"
    And a loan should be created with:
      | Field      | Value       |
      | Borrower   | John Doe    |
      | Amount     | ₹5,000      |
      | Due Date   | Feb 25      |
      | Status     | Outstanding |
    And a transaction should be created with:
      | Field  | Value              |
      | Type   | Loan-Disbursement  |
      | Amount | -₹5,000            |
      | Member | John Doe           |
    And the total fund should decrease by ₹5,000
    And the outstanding loans should increase by ₹5,000
    And I should see success message "Loan approved and disbursed: ₹5,000.00"
    And the request should disappear from "Pending Loan Requests"

  Scenario: Approve loan request with amount override
    Given there is a pending loan request for ₹10,000
    When I click "Review" on the request
    And I change approved amount to "8000"
    And I add admin comments "Reduced amount per policy"
    And I click "Approve & Disburse"
    Then the loan should be created with amount ₹8,000 (not ₹10,000)
    And the request should show approved amount ₹8,000
    And the request should show admin comments "Reduced amount per policy"

  Scenario: Approve loan request with due date override
    Given there is a pending loan request with due date "Mar 15, 2026"
    When I click "Review" on the request
    And I change approved due date to "Feb 28, 2026"
    And I click "Approve & Disburse"
    Then the loan should be created with due date "Feb 28, 2026"
    And the request should show approved due date "Feb 28, 2026"

  Scenario: Prevent double-approval (concurrency control)
    Given a loan request is being approved by Admin A
    When Admin B tries to approve the same request simultaneously
    Then Admin B should see error "Request already processed"
    And only one loan should be created

  Scenario: Reject loan request with reason
    Given there is a pending loan request:
      | Member   | Amount  | Due Date | Reason    |
      | John Doe | ₹50,000 | Mar 15   | Business  |
    When I click "Review" on the request
    And I click "Reject"
    And I enter rejection reason "Exceeds lending budget limits"
    And I confirm the rejection
    Then the request status should change to "Rejected"
    And the rejection reason should be "Exceeds lending budget limits"
    And no loan should be created
    And no transaction should be created
    And the total fund should remain unchanged
    And I should see success message "Loan request rejected."
    And the request should disappear from "Pending Loan Requests"

  Scenario: Rejection reason is required
    Given there is a pending loan request
    When I click "Review" on the request
    And I click "Reject"
    And I leave the rejection reason empty
    And I confirm the rejection
    Then I should see error "Rejection reason must be at least 10 characters."
    And the request should remain "Pending"

  Scenario: Re-validate lending budget at approval time
    Given there is a pending loan request for ₹40,000
    And the lending budget was ₹50,000 when the request was submitted
    But the lending budget is now ₹30,000 (due to other loans)
    When I try to approve the request
    Then I should see error "Exceeds available lending budget of ₹30,000"
    And the approval should fail
    And no loan should be created

  Scenario: Approve request when member's outstanding is near limit
    Given John Doe has ₹180,000 outstanding loans
    And there is a pending loan request from John Doe for ₹15,000
    When I try to approve the request
    Then the approval should succeed
    And John Doe's total outstanding should be ₹195,000

  Scenario: Cannot approve request if it would exceed member's outstanding limit
    Given John Doe has ₹190,000 outstanding loans
    And there is a pending loan request from John Doe for ₹20,000
    When I try to approve the request
    Then I should see error related to member outstanding limit
    And the approval should fail
```

---

## Feature: Member Loan Request Status Tracking

```gherkin
Feature: Member Loan Request Status Tracking
  As a Member
  I want to see the status and details of my loan requests
  So that I know whether my request was approved or rejected and why

  Background:
    Given I am logged in as a Member

  Scenario: View approved loan request details
    Given I submitted a loan request for ₹5,000 with due date "Feb 25"
    And an Admin approved it with amount ₹5,000 on "Jan 26"
    When I view "My Loan Requests" panel
    Then I should see the request with status "✅ Approved"
    And the decision details should show "₹5,000.00 on Jan 26, 2026"
    And I should not see a "Cancel" button

  Scenario: View approved loan request with admin override
    Given I submitted a loan request for ₹10,000
    And an Admin approved it with amount ₹8,000 and comments "Reduced per policy"
    When I view "My Loan Requests" panel
    Then I should see the request with status "✅ Approved"
    And the decision details should show the approved amount ₹8,000
    And I should be able to see the approved amount differs from requested amount

  Scenario: View rejected loan request with reason
    Given I submitted a loan request for ₹50,000
    And an Admin rejected it with reason "Exceeds lending budget limits"
    When I view "My Loan Requests" panel
    Then I should see the request with status "❌ Rejected"
    And the decision details should show "Exceeds lending budget limits"
    And I should not see a "Cancel" button

  Scenario: View pending loan request
    Given I submitted a loan request for ₹3,000
    And it has not been reviewed yet
    When I view "My Loan Requests" panel
    Then I should see the request with status "🟡 Pending"
    And the decision details should show "Awaiting Admin review"
    And I should see a "Cancel" button

  Scenario: Loan request history is sorted by date
    Given I have submitted 5 loan requests over the past month
    When I view "My Loan Requests" panel
    Then the requests should be sorted by request date (newest first)
```

---

## Feature: Integration with Existing Loan Management

```gherkin
Feature: Integration with Existing Loan Management
  As a user of the system
  I want approved loan requests to integrate seamlessly with the existing loan tracking
  So that the system remains consistent and accurate

  Scenario: Approved loan appears in Active Loans table
    Given a loan request for ₹5,000 is approved
    When I view the "Active Loans" table
    Then I should see a new loan for ₹5,000
    And the loan should show:
      | Field           | Value       |
      | Borrower        | John Doe    |
      | Amount          | ₹5,000      |
      | Paid            | ₹0          |
      | Remaining       | ₹5,000      |
      | Status          | Outstanding |

  Scenario: Loan disbursement transaction appears in history
    Given a loan request for ₹5,000 is approved on "Jan 26, 2026"
    When I view the "Transaction History" table
    Then I should see a new transaction:
      | Field   | Value                |
      | Date    | Jan 26, 2026         |
      | Member  | John Doe             |
      | Type    | Loan Disbursement    |
      | Amount  | -₹5,000              |

  Scenario: Total fund decreases after loan approval
    Given the total fund is ₹100,000
    And a loan request for ₹5,000 is approved
    When I view the "Common Fund Status"
    Then the total fund should be ₹95,000
    And the outstanding loans should increase by ₹5,000
    And the total amount should remain ₹100,000

  Scenario: Lending budget updates after loan approval
    Given the total amount is ₹100,000
    And the lending budget is ₹50,000 (50%)
    When a loan request for ₹10,000 is approved
    Then the current total fund should be ₹90,000
    And the outstanding loans should be ₹10,000
    And the total amount should remain ₹100,000
    And the lending budget should still be ₹50,000 (50% of ₹100,000)

  Scenario: Can return approved loan using existing return flow
    Given a loan request for ₹5,000 was approved and disbursed
    When I use the existing "Record Loan Return" feature
    And I select the loan
    And I record a full return of ₹5,000
    Then the loan status should change to "Returned"
    And the total fund should increase by ₹5,000
    And the outstanding loans should decrease by ₹5,000
```

---

## Feature: Edge Cases and Error Handling

```gherkin
Feature: Edge Cases and Error Handling
  As a user of the system
  I want the system to handle edge cases gracefully
  So that data remains consistent and users get clear feedback

  Scenario: Member submits request then Admin deletes member
    Given John Doe submits a loan request
    And the request is pending
    When an Admin deletes John Doe's member account
    And another Admin tries to approve the request
    Then the system should show an error about orphaned request
    And the approval should fail gracefully

  Scenario: Lending budget depletes between submission and approval
    Given the lending budget is ₹10,000
    And John Doe submits a request for ₹8,000
    And another member's loan of ₹5,000 gets approved (budget now ₹5,000)
    When Admin tries to approve John Doe's request for ₹8,000
    Then the system should show error "Exceeds available lending budget of ₹5,000.00"
    And the approval should fail

  Scenario: Due date becomes past date during review
    Given a loan request was submitted 6 months ago
    And the requested due date is now in the past
    When Admin tries to approve the request
    Then the Admin should be able to override the due date
    And select a valid future date

  Scenario: Network failure during approval
    Given a loan request is being approved
    When there is a network interruption during the approval process
    Then the system should either:
      | Option | Outcome                                      |
      | 1      | Complete all updates (loan + txn + request)  |
      | 2      | Complete none of the updates (rollback)      |
    And partial updates should not occur (data consistency maintained)

  Scenario: Member tries to approve own request
    Given I am logged in as a Member
    And I have submitted a loan request
    When I try to access Admin approval functions
    Then I should be denied access
    And only Admins should be able to approve/reject

  Scenario: Multiple pending requests from same member
    Given John Doe has 2 pending loan requests:
      | Amount | Due Date |
      | ₹5,000 | Feb 15   |
      | ₹3,000 | Mar 1    |
    And John Doe has ₹0 outstanding loans
    When Admin approves the first request for ₹5,000
    Then John Doe should have ₹5,000 outstanding
    When Admin tries to approve the second request for ₹3,000
    Then the approval should succeed if total doesn't exceed ₹200,000
    And John Doe should have ₹8,000 outstanding
```

---

## Summary Statistics

**Total Scenarios**: 39  
**Feature Coverage**:
- ✅ Member request submission (8 scenarios)
- ✅ Admin approval flow (9 scenarios)
- ✅ Admin rejection flow (2 scenarios)
- ✅ Member status tracking (5 scenarios)
- ✅ Integration with existing features (5 scenarios)
- ✅ Edge cases & error handling (10 scenarios)

**Test Automation Readiness**: All scenarios are written in Gherkin format and can be automated using Cucumber/Behave or similar BDD frameworks.

---

**Created**: January 26, 2026  
**Format**: Gherkin (Given-When-Then)  
**Purpose**: Acceptance testing, QA validation, automated testing
