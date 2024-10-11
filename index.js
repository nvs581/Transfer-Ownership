const chalk = require('chalk'); //optional
const fs = require('fs');
const { google } = require('googleapis');
const express = require('express');
const destroyer = require('server-destroy'); // To close the server after authorization
const { exec } = require('child_process'); // For opening the browser (Windows)
const readline = require('readline'); // For reading user input
require('dotenv').config(); // Load environment variables from .env

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Get credentials from environment variables
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uris = process.env.REDIRECT_URI.split(',');

// Set up OAuth2 client
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

fs.readFile(TOKEN_PATH, (err, token) => {
  if (err) return getAccessToken(oAuth2Client);
  oAuth2Client.setCredentials(JSON.parse(token));
  console.log('\r\nToken already available.\r\n');

  // Prompt the user for file ID and new owner's email
  promptUserForInput(oAuth2Client);
});

function getAccessToken(oAuth2Client) {
  const app = express();
  const port = 3000;
  const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  destroyer(server);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\r\nAuthorize this app by visiting this url:', authUrl);
  exec(`start ${authUrl}`);

  app.get('/auth/callback', (req, res) => {
    const code = req.query.code;
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return res.send('Error retrieving access token');
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      res.send('Authentication successful! You can close this tab.');
      server.destroy();
    });
  });
}

/**
 * Prompt user for file ID and new owner's email.
 * @param {OAuth2Client} auth - The authenticated Google OAuth client.
 */
function promptUserForInput(auth) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\r\nEnter the File ID: ', (fileId) => {
    rl.question('Enter the New Owner Email: ', (newOwnerEmail) => {
      initiateOwnershipTransfer(auth, fileId, newOwnerEmail);
      rl.close();
    });
  });
}

/**
 * Initiate ownership transfer by the current owner.
 * @param {OAuth2Client} auth - The authenticated Google OAuth client.
 * @param {string} fileId - The ID of the file you want to transfer ownership of.
 * @param {string} newOwnerEmail - The email address of the new prospective owner.
 */

function initiateOwnershipTransfer(auth, fileId, newOwnerEmail) {
  const drive = google.drive({ version: 'v3', auth });

  // First, make the new owner a writer on the file
  drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'writer',               // Temporarily set the new owner as a writer
      type: 'user',                 // Type is 'user' for a specific person
      emailAddress: newOwnerEmail   // New owner's email
    },
    fields: 'id',
    sendNotificationEmail: true     // Send an email to the prospective owner
  }, (err, res) => {
    if (err) {
      console.error(chalk.red('Error creating writer permission:'), err);
      return;
    }
    
    // Store the permission ID for the next step
    const permissionId = res.data.id;

    // Log a simple and clean message in green
    console.log(chalk.green(`Successfully added ${newOwnerEmail} as a writer. Proceeding with ownership transfer...`));

    // Next, update the permission to transfer ownership
    drive.permissions.update({
      fileId: fileId,
      permissionId: permissionId,  // Use the permission ID from the previous response
      requestBody: {
        role: 'writer',
        pendingOwner: true          // Make the new owner the pending owner
      },
      fields: 'id'
    }, (err, res) => {
      if (err) {
        console.error(chalk.red('Error updating permission with pendingOwner:'), err);
        return;
      }

      // Log a clean ownership transfer message in green
      console.log(chalk.green(`Ownership transfer in progress for file ID: ${fileId}. ${newOwnerEmail} will become the new owner soon.`));

      // Retrieve and verify the permissions to ensure pendingOwner is set
      drive.permissions.list({
        fileId: fileId,
        fields: 'permissions(id, type, emailAddress, role, pendingOwner)'
      }, (err, res) => {
        if (err) {
          console.error(chalk.red('Error retrieving permissions:'), err);
          return;
        }
        
        // Extracting and logging only essential information
        const permissions = res.data.permissions.map(permission => {
          return {
            emailAddress: permission.emailAddress,
            role: permission.role,
            pendingOwner: permission.pendingOwner
          };
        });

        console.log(chalk.blue('Current Permissions:'));
        permissions.forEach(permission => {
          console.log(chalk.blue(`- ${permission.emailAddress}: ${permission.role} (Pending Owner: ${permission.pendingOwner})`));
        });
      });
    });
  });
}
