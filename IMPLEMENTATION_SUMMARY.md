# Upload Pictures Permission Implementation

## Overview
Implemented a feature that allows admins to control whether non-admin users can upload pictures in the Star Wars campaign notes section.

## Changes Made

### 1. Settings.jsx
- **Added state variables:**
  - `uploadPicturesEnabled`: Tracks the current state of the Upload Pictures setting
  - `savingUploadPictures`: Tracks the saving state of the toggle

- **Added useEffect hook:**
  - Fetches the `Upload_pictures` setting from the `Admin_Control` table when the user is admin
  - Runs when `isAdmin` changes

- **Added handler function:**
  - `handleToggleUploadPictures()`: Updates the `Admin_Control` table with the new setting value

- **Added UI component:**
  - Checkbox in the admin section that allows toggling the "Allow Non-Admin Users to Upload Pictures" setting
  - Shows a "Saving..." indicator while the update is in progress
  - Displays success/error messages

### 2. SW_notes.jsx
- **Added state variables:**
  - `isAdmin`: Tracks if the current user is an admin
  - `uploadPicturesEnabled`: Tracks the current state of the Upload Pictures setting

- **Added loadPermissions() function:**
  - Fetches the current user's admin status from the `user` table
  - Fetches the `Upload_pictures` setting from the `Admin_Control` table
  - Sets both state variables accordingly

- **Updated useEffect:**
  - Calls `loadPermissions()` when the component loads

- **Updated Upload Picture button:**
  - Conditionally renders the button only if: `(isAdmin || uploadPicturesEnabled)`
  - This means the button is shown if the user is an admin OR if the setting is enabled

## Database
The implementation uses the existing `Admin_Control` table with the `Upload_pictures` column (boolean).

## User Experience
1. **For Admins:**
   - Can see the "Allow Non-Admin Users to Upload Pictures" checkbox in Settings
   - Can toggle it on/off to control non-admin access
   - Can always upload pictures regardless of the setting

2. **For Non-Admins:**
   - Can upload pictures only if the admin has enabled the setting
   - Cannot see the setting in Settings (only admins can)

