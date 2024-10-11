const fs = require('fs');
const { google } = require('googleapis');
const express = require('express');
const destroyer = require('server-destroy'); // To close the server after authorization
const { exec } = require('child_process'); // For opening the browser (Windows)

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content));
});

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('Token already available.');
    
    // Call transferOwnership after successfully setting credentials
    initiateOwnershipTransfer(oAuth2Client, 'file-ID', 'new-owner-email');
  });
}

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
  
  console.log('Authorize this app by visiting this url:', authUrl);
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
      console.error('Error creating writer permission:', err);
      return;
    }
    const permissionId = res.data.id;
    console.log(`Writer permission created. Permission ID: ${permissionId}`);

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
        console.error('Error updating permission with pendingOwner:', err);
        return;
      }
      console.log('Ownership transfer initiated with pendingOwner set to true.');

      // Now retrieve and verify the permissions to ensure pendingOwner is set
      drive.permissions.list({
        fileId: fileId,
        fields: 'permissions(id, type, emailAddress, role, pendingOwner)'
      }, (err, res) => {
        if (err) {
          console.error('Error retrieving permissions:', err);
          return;
        }
        console.log('Permissions:', res.data.permissions);
      });
    });
  });
}