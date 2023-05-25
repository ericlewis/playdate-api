import { JSDOM } from "jsdom";
import makeFetchCookie from "fetch-cookie";

/**
 * Playdate API client.
 */
export default class PlaydateClient {
  /**
   * @param {string} token The authentication token.
   */
  constructor(token) {
	this.token = token;
	this.loginToken = null;
	this.fetchCookie = makeFetchCookie(fetch);
	this.baseURL = "https://play.date/api/v2";
	this.baseWebURL = "https://play.date";
	this.headers = {
	  Authorization: `Token ${this.token}`,
	  "Content-Type": "application/json",
	};
  }

  /**
   * Validates a serial number.
   *
   * The serial number should have a specific structure: PDU1-Y followed by 6 digits.
   * For example: "PDU1-Y123456"
   *
   * @private
   * @param {string} serial - The serial number to validate.
   * @throws {Error} If the serial number does not adhere to the required structure.
   */
  _validateSerial(serial) {
	// Check for exact length
	if (serial.length !== 12) {
	  throw new Error(`Invalid serial number: ${serial}`);
	}

	// Match with regular expression
	const regex = /^PDU1-Y[0-9]{6}$/;
	const match = serial.match(regex);

	// Check if it's a match and not all zeros
	if (!match) {
	  throw new Error(`Invalid serial number: ${serial}`);
	}
  }

  /**
   * Makes a request to a specified endpoint and returns the response data.
   *
   * @private
   * @param {string} endpoint - The endpoint to which the request should be made.
   * @param {string} [method="GET"] - The HTTP method to use for the request. Defaults to "GET".
   * @param {Object} [body] - The body of the request, if applicable.
   * @returns {Promise} A promise that resolves to the data returned in the response.
   * @throws {Error} If the request fails, throws an Error with the response message or a default message.
   */
  async _request(endpoint, method = "GET", body) {
	if (!this.token) {
	  throw new Error("Missing token");
	}

	const options = {
	  method,
	  headers: this.headers,
	};
	if (body) {
	  options.body = JSON.stringify(body);
	}
	const response = await fetch(`${this.baseURL}${endpoint}`, options);
	const data = await response.json();
	if (!response.ok) {
	  throw new Error(data.message || "Request failed");
	}
	return data;
  }

  /**
   * Retrieves a CSRF (Cross-Site Request Forgery) token from a specified URL.
   *
   * @private
   * @param {string} url - The URL from which to fetch the CSRF token.
   * @returns {Promise} A promise that resolves to the CSRF token.
   */
  async _getMiddlewareToken(url) {
	const response = await this.fetchCookie(url);

	if (!response.ok) {
	  throw new Error("Invalid request.");
	}

	const text = await response.text();
	const dom = new JSDOM(text);

	return dom.window.document
	  .querySelector(`input[name="csrfmiddlewaretoken"]`)
	  .getAttribute("value");
  }

  /**
   * Method to perform a login operation.
   *
   * @param {string} username The username.
   * @param {string} password The password.
   */
  async login(username, password) {
	const url = `${this.baseWebURL}/signin/`;
	const token = await this._getMiddlewareToken(url);
	const body = new URLSearchParams();

	body.append("csrfmiddlewaretoken", token);
	body.append("username", username);
	body.append("password", password);

	const result = await this.fetchCookie(url, {
	  body: body.toString(),
	  method: "POST",
	  headers: {
		Referer: url,
		"Content-Type": "application/x-www-form-urlencoded",
	  },
	});

	if (!result.ok) {
	  throw new Error("Login failed.");
	}

	this.loginToken = "logged+in";

	return true;
  }

  /**
   * Method to remove a device.
   *
   * @param {string} serialNumber The serial number of the device to remove.
   */
  async removeDevice(serialNumber) {
	if (!this.loginToken) {
	  throw new Error("You must be logged in to remove a device");
	}
	this._validateSerial(serialNumber);
	const url = `${this.baseWebURL}/devices/${serialNumber}/remove/`;
	const token = await this._getMiddlewareToken(url);
	if (!token) {
	  throw new Error("Device not found");
	}
	const body = new URLSearchParams();
	body.append("csrfmiddlewaretoken", token);
	return this.fetchCookie(url, {
	  body: body.toString(),
	  method: "POST",
	  headers: {
		Referer: url,
		"Content-Type": "application/x-www-form-urlencoded",
	  },
	});
  }

  /**
   * Method to get registration pin.
   *
   * @param {string} serialNumber The serial number of the device.
   * @returns {Object} The register data.
   */
  async getDevicePin(serialNumber) {
	this._validateSerial(serialNumber);
	this.idempotencyKey = Math.random().toFixed(digit).split(".")[1];
	const result = await fetch(
	  `${this.baseURL}/device/register/${serialNumber}`,
	  {
		headers: {
		  "idempotency-key": this.idempotencyKey,
		},
	  }
	);
	const json = await result.json();
	return json;
  }

  /**
   * Method to add a register a device.
   *
   * @param {string} pin The pin of the device to add.
   */
  async addDevice(pin) {
	if (!this.loginToken) {
	  throw new Error("You must be logged in to add a device");
	}

	const url = `${this.baseWebURL}/pin/`;
	const token = await this._getMiddlewareToken(url);

	const body = new URLSearchParams();
	body.append("csrfmiddlewaretoken", token);
	body.append("pin", pin);

	const result = await this.fetchCookie(url, {
	  body: body.toString(),
	  method: "POST",
	  headers: {
		Referer: url,
		"Content-Type": "application/x-www-form-urlencoded",
	  },
	});

	if (!result.ok) {
	  throw new Error("Could not add device.");
	}

	return true;
  }

  /**
   * Method to get access token for registered device.
   *
   * @param {string} serialNumber The serial number of the device.
   * @returns {Object} The register complete data.
   */
  async getDeviceAccessToken(serialNumber) {
	if (!this.idempotencyKey) {
	  throw new Error("You must first add a device before this can be called.");
	}
	this._validateSerial(serialNumber);
	const result = await fetch(
	  `${this.baseURL}/device/register/${serialNumber}/complete/`,
	  {
		headers: {
		  "idempotency-key": this.idempotencyKey,
		},
	  }
	);
	const json = await result.json();
	this.idempotencyKey = null;
	return json;
  }

  /**
   * Method to register and initialize a device.
   * This method follows the sequence: removeDevice -> getDeviceRegister -> addDevice -> getDeviceRegisterComplete.
   *
   * @param {string} serialNumber The serial number of the device to register.
   * @returns {Object} The registration data.
   */
  async registerDevice(serialNumber) {
	if (!this.loginToken) {
	  throw new Error("You must be logged in register a device");
	}

	this._validateSerial(serialNumber);

	// Step 1: Remove device if it already exists
	try {
	  await this.removeDevice(serialNumber);
	} catch (error) {
	  // Handle or ignore error if device does not exist
	}

	// Step 2: Get device register
	const { pin } = await this.getDevicePin(serialNumber);

	// Step 3: Add device
	await this.addDevice(pin);

	// Step 4: Get device register complete
	const registerCompleteData = await this.getDeviceAccessToken(serialNumber);
	const { access_token } = registerCompleteData;

	// Update this.token with the new token from the registration process
	this.token = access_token;
	this.loginToken = access_token;
	this.headers = {
	  Authorization: `Token ${this.token}`,
	  "Content-Type": "application/json",
	};

	// Return the registration data
	return registerCompleteData;
  }

  /**
   * Echoes back the sent JSON body.
   * @param {Object} jsonBody - The JSON body to send to the endpoint.
   * @returns {Promise} The server's response to the request.
   */
  authEcho(jsonBody) {
	return this._request("/auth_echo/", "POST", jsonBody);
  }

  /**
   * Retrieves the player profile for the user that owns the current access token.
   * @returns {Promise} The server's response to the request.
   */
  getPlayer() {
	return this._request("/player/");
  }

  /**
   * Retrieves the player profile for a specific user.
   * @param {string} playerId - The ID of the player to retrieve.
   * @returns {Promise} The server's response to the request.
   */
  getPlayerById(playerId) {
	return this._request(`/player/${playerId}/`);
  }

  /**
   * Uploads avatar data.
   * @param {Object} avatarData - The avatar data to upload.
   * @returns {Promise} The server's response to the request.
   */
  uploadAvatar(avatarData) {
	return this._request("/player/avatar/", "POST", avatarData);
  }

  /**
   * Retrieves an array of Schedule entries for any seasons that the user has access to.
   * @returns {Promise} The server's response to the request.
   */
  getGamesScheduled() {
	return this._request("/games/scheduled/");
  }

  /**
   * Retrieves an array of Game entries for games that the user has sideloaded.
   * @returns {Promise} The server's response to the request.
   */
  getGamesUser() {
	return this._request("/games/user/");
  }

  /**
   * Retrieves an array of Game entries for additional system applications.
   * @returns {Promise} The server's response to the request.
   */
  getGamesSystem() {
	return this._request("/games/system/");
  }

  /**
   * Retrieves an array of Game entries for games that the user has purchased through Catalog.
   * @returns {Promise} The server's response to the request.
   */
  getGamesPurchased() {
	return this._request("/games/purchased/");
  }

  /**
   * Retrieves an array of Catalog Game entries for games that are available through Catalog.
   * @returns {Promise} The server's response to the request.
   */
  getGamesCatalog() {
	return this._request("/games/catalog");
  }

  /**
   * Retrieves Catalog Game entry for a specific Catalog game.
   * @param {number} idx - The index of the game to retrieve from the Catalog.
   * @returns {Promise} The server's response to the request.
   */
  getGameCatalogById(idx) {
	return this._request(`/games/catalog/${idx}`);
  }

  /**
   * Initiates the purchase flow for a game.
   * @param {string} bundleId - The ID of the game to purchase.
   * @returns {Promise} The server's response to the request.
   */
  purchaseGame(bundleId) {
	return this._request(`/games/${bundleId}/purchase/`, "POST");
  }

  /**
   * Completes the purchase flow for a game.
   * @param {string} bundleId - The ID of the game to confirm purchase for.
   * @returns {Promise} The server's response to the request.
   */
  confirmPurchase(bundleId) {
	return this._request(`/games/${bundleId}/purchase/confirm`, "POST");
  }

  /**
   * Makes a request to fetch firmware based on a provided version number.
   * If no version is provided, it defaults to "1.13.6".
   *
   * @param {string} version - The version of the firmware to fetch.
   * @return {Promise} The server's response to the request.
   */
  getFirmware(version = "1.13.6") {
	return this._request(`/firmware?current_version=${version}`);
  }
}
