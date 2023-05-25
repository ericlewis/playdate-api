# Playdate API Client

The `playdate-api` package is a JavaScript library that interacts with various Playdate APIs. This library abstracts and simplifies the interaction with Playdate endpoints for tasks like user login, device registration, and game purchasing.

## Installation

You can install `playdate-api` using npm:

```sh
npm install playdate-api
```

## Usage

To use this library, you'll first need to import it:

```javascript
import PlaydateClient from 'playdate-api';
```

Next, create a new client instance with your Playdate token:

```javascript
const client = new PlaydateClient('your-playdate-token');
```

Now you're ready to interact with the Playdate API!

## Examples

### User Login

```javascript
const client = new PlaydateClient('your-playdate-token');

client.login('your-username', 'your-password')
  .then(response => {
	console.log('Login successful!', response);
  })
  .catch(error => {
	console.error('An error occurred:', error);
  });
```

### Registering a Device

```javascript
const client = new PlaydateClient('your-playdate-token');

client.login('your-username', 'your-password')
  .then(() => {
	return client.registerDevice('PDU1-Y123456');
  })
  .then(response => {
	console.log('Device registration successful!', response);
  })
  .catch(error => {
	console.error('An error occurred:', error);
  });
```

### Retrieving Player Profile

```javascript
const client = new PlaydateClient('your-playdate-token');

client.getPlayer()
  .then(response => {
	console.log('Player profile:', response);
  })
  .catch(error => {
	console.error('An error occurred:', error);
  });
```

### Purchasing a Game

```javascript
const client = new PlaydateClient('your-playdate-token');

client.login('your-username', 'your-password')
  .then(() => {
	return client.purchaseGame('game-bundle-id');
  })
  .then(response => {
	console.log('Game purchase initiated!', response);
	return client.confirmPurchase('game-bundle-id');
  })
  .then(response => {
	console.log('Game purchase confirmed!', response);
  })
  .catch(error => {
	console.error('An error occurred:', error);
  });
```
