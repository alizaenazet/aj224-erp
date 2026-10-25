# Spec Delta

## Purpose

Delivers in-app notifications from system events and scheduled checks to the right users, and lets each user see, open and mark them as read (UMM-06).

## ADDED Requirements

### Requirement: Notifications target users or roles
The system SHALL create notifications for a specific user or for every active user holding given roles. Inactive users SHALL NOT receive new notifications. (UMM-06)

#### Scenario: Notify a role
- **WHEN** a system event notifies the Finance role
- **THEN** every active Finance user gets the notification and users of other roles do not

#### Scenario: Inactive user skipped
- **WHEN** a role is notified while one of its users is deactivated
- **THEN** the deactivated user receives nothing

### Requirement: Repeat reminders are not duplicated
The system SHALL accept an optional reminder key so the same reminder is delivered to a user only once. (UMM-06)

#### Scenario: Daily check runs twice
- **WHEN** a scheduled check sends the reminder with the same key to the same user twice
- **THEN** the user has only one copy of that notification

### Requirement: Only the system creates notifications
Users SHALL NOT be able to create, delete or edit notifications through the API, except marking their own notifications as read. (UMM-06, PRD §14)

#### Scenario: Direct insert refused
- **WHEN** a signed-in user tries to insert a notification through the API
- **THEN** the request is refused

#### Scenario: Others' notifications hidden
- **WHEN** a Marketing user reads notifications through the API
- **THEN** only their own notifications are returned

### Requirement: Notification bell
The app header SHALL show a bell with the number of unread notifications and, when opened, the most recent notifications (title, text, time in WIB, read state). Choosing a notification SHALL mark it read and open its linked page. (UMM-06)

#### Scenario: Unread count
- **WHEN** a Finance user has 3 unread notifications
- **THEN** the bell shows 3

#### Scenario: Open a notification
- **WHEN** the user chooses a notification that links to `/settings/users`
- **THEN** it is marked read, the count drops by one, and `/settings/users` opens

#### Scenario: Mark all as read
- **WHEN** the user chooses "Tandai semua dibaca"
- **THEN** all their notifications are marked read and the bell shows no count

### Requirement: Notification list page
Each user SHALL have a Notifikasi page listing all their notifications newest first, paginated, with unread ones marked. (UMM-06)

#### Scenario: Older notifications
- **WHEN** a user with 60 notifications opens Notifikasi
- **THEN** the newest 50 are shown with a way to open the next page
