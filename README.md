# GDrive_Transfer_Ownership

## Project Documentation

### 1. Project Overview

This Node.js application facilitates the transfer of file ownership in Google Drive. It leverages the Google Drive API to authenticate users, read file permissions, and transfer ownership from one user to another.

### 2. Prerequisites

- **Node.js**: Ensure that Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).
- **Google Account**: A Google account with access to Google Drive.
- **Environment Variables**: Create a `.env` file to store sensitive credentials such as `CLIENT_ID`, `CLIENT_SECRET`, and `REDIRECT_URI`.

The application follows these key steps to transfer ownership of a Google Drive file:

Load Environment Variables: The application loads sensitive credentials from the .env file using dotenv.

OAuth2 Client Setup:

An OAuth2 client is created using the client ID, client secret, and redirect URI.
It attempts to read an existing token from token.json to authenticate subsequent requests. If it doesn't exist, it calls the getAccessToken function to initiate the authentication flow.
Authorization Process:

The getAccessToken function starts a local server to handle the OAuth2 callback.
It generates an authorization URL, which is opened in the user's browser.
After the user authorizes the application, Google redirects them back with an authorization code.
The application retrieves an access token using the code, which is then saved to token.json.
User Input:

The application prompts the user for the file ID and the email address of the new owner using readline.
Ownership Transfer Process:

The initiateOwnershipTransfer function is called with the provided file ID and new owner's email.
It first grants the new owner "writer" permissions on the file.
Then, it updates the permission to set the new owner as the "pending owner."
Finally, it lists current permissions to verify the changes.
