# Playdate API Client

This is a node library for interacting with various Playdate APIs.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [License](#license)

## Installation

To use this package, you will need node 18+ and npm installed on your machine. Run the following command to install the package:

```bash
npm install playdate-api
```

## Usage

To use this library, you will need to import it and instantiate a new `PlaydateClient` with your Playdate API token.

```javascript
import PlaydateClient from 'playdate-api';
const client = new PlaydateClient('your-api-token');
```

The `PlaydateClient` class has several methods for interacting with the Playdate API. Note that some methods require the `login` method to be called first, since they need authentication.

Access Token is only optional if you have a working one, otherwise you need to set one up via `registerDevice`.

## Examples

Here's an example of how you could use this library to register a device:

```javascript
import PlaydateClient from 'playdate-api';

const client = new PlaydateClient();
await client.login('username', 'password');
const registrationData = await client.registerDevice('PDU1-Y123456');

console.log(registrationData);
```

## License

This project is licensed under the MIT License.
