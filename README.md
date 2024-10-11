# GDrive_Transfer_Ownership

## Project Overview

This Node.js application facilitates the transfer of file ownership in Google Drive. It leverages the Google Drive API to authenticate users, read file permissions, and transfer ownership from one user to another.

## Prerequisites

### Node.js

Ensure that Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### Google Account

You will need a Google account with access to Google Drive.

### Environment Variables

Create a `.env` file in the root directory of the project to store sensitive credentials. The following variables are required:

```plaintext
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
REDIRECT_URI=your_redirect_uri
```
