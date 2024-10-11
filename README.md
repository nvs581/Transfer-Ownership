# GDrive_Transfer_Ownership

## Project Documentation

### 1. Project Overview

This Node.js application facilitates the transfer of file ownership in Google Drive. It leverages the Google Drive API to authenticate users, read file permissions, and transfer ownership from one user to another.

### 2. Prerequisites

- **Node.js**: Ensure that Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).
- **Google Account**: A Google account with access to Google Drive.
- **Environment Variables**: Create a `.env` file to store sensitive credentials such as `CLIENT_ID`, `CLIENT_SECRET`, and `REDIRECT_URI`.

### 3. How It Works
The application follows these key steps to transfer ownership of a Google Drive file:

1. **Load Environment Variables**  
   The application loads sensitive credentials from the `.env` file using the `dotenv` library. This ensures that the application has access to the necessary API credentials without hardcoding them into the source code.

2. **OAuth2 Client Setup**  
   - An OAuth2 client is created using the client ID, client secret, and redirect URI defined in the `.env` file.
   - The application attempts to read an existing token from `token.json` to authenticate subsequent requests. If the token does not exist, it calls the `getAccessToken` function to initiate the authentication flow.

3. **Authorization Process**  
   - The `getAccessToken` function starts a local server to handle the OAuth2 callback.
   - It generates an authorization URL, which is opened in the user's browser.
   - After the user authorizes the application, Google redirects them back with an authorization code.
   - The application retrieves an access token using the code and saves it to `token.json` for future use.

4. **User Input**  
   The application prompts the user for the file ID of the Google Drive file and the email address of the new owner using the `readline` module.

5. **Ownership Transfer Process**  
   - The `initiateOwnershipTransfer` function is called with the provided file ID and new owner's email address.
   - First, it grants the new owner "writer" permissions on the file.
   - Then, it updates the permission to set the new owner as the "pending owner."
   - Finally, it lists the current permissions to verify that the changes were successfully applied.

This sequence of steps allows the application to efficiently handle the file ownership transfer process in Google Drive.

## Acknowledgments

This project is based on [google-drive-ownership-transfer](https://github.com/arexonmortel/google-drive-ownership-transfer) by [arexonmortel](https://github.com/arexonmortel). We appreciate their contributions and the groundwork they have laid for this project.
