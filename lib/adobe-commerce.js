/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import crypto from "node:crypto";

import { Core } from "@adobe/aio-sdk";
import got from "got";
import Oauth1a from "oauth-1.0a";

import { resolveAuthOptions } from "./adobe-auth.js";
import { HTTP_INTERNAL_ERROR } from "./http.js";

/**
 * Provides an instance of the Commerce HTTP client
 *
 * @param {string} commerceUrl Base URL of the Commerce API
 * @param {object} options Configuration options for the client
 * @param {object} [options.integrationOptions] Integration options for OAuth1.0a
 * @param {object} [options.imsOptions] IMS options for bearer token authentication
 * @param {object} options.logger Logger instance for logging requests
 * @returns {Promise<object>} Configured Got instance for making HTTP requests
 */
function getCommerceHttpClient(
  commerceUrl,
  { integrationOptions, imsOptions, logger },
) {
  if (!commerceUrl) {
    throw new Error("Commerce URL must be provided");
  }

  const commerceGot = got.extend({
    http2: true,
    responseType: "json",
    prefixUrl: commerceUrl,
    headers: {
      "Content-Type": "application/json",
    },
    hooks: {
      beforeRequest: [
        (options) => logger.debug(`Request [${options.method}] ${options.url}`),
      ],
      beforeRetry: [
        (options, error, retryCount) =>
          logger.debug(
            `Retrying request [${options.method}] ${options.url} - count: ${retryCount} - error: ${error.code} - ${error.message}`,
          ),
      ],
      beforeError: [
        (error) => {
          const { response } = error;
          if (response?.body) {
            error.responseBody = response.body;
          }
          return error;
        },
      ],
      afterResponse: [
        (response) => {
          logger.debug(
            `Response [${response.request.options.method}] ${response.request.options.url} - ${response.statusCode} ${response.statusMessage}`,
          );
          return response;
        },
      ],
    },
  });

  if (integrationOptions) {
    logger.debug("Using Commerce client with integration options");
    const oauth1aHeaders = oauth1aHeadersProvider(integrationOptions);

    return commerceGot.extend({
      handlers: [
        (options, next) => {
          options.headers = {
            ...options.headers,
            ...oauth1aHeaders(options.url.toString(), options.method),
          };
          return next(options);
        },
      ],
    });
  }

  logger.debug("Using Commerce client with IMS options");
  return commerceGot.extend({
    headers: {
      "x-ims-org-id": imsOptions.imsOrgId,
      "x-api-key": imsOptions.apiKey,
      Authorization: `Bearer ${imsOptions.accessToken}`,
    },
  });
}

/**
 * Generates OAuth1.0a headers for the given integration options
 *
 * @param {object} integrationOptions Options for OAuth1.0a
 * @returns {Function} Function that returns OAuth1.0a headers for a given URL and method
 */
function oauth1aHeadersProvider(integrationOptions) {
  const oauth = Oauth1a({
    consumer: {
      key: integrationOptions.consumerKey,
      secret: integrationOptions.consumerSecret,
    },
    signature_method: "HMAC-SHA256",
    hash_function: (baseString, key) =>
      crypto.createHmac("sha256", key).update(baseString).digest("base64"),
  });

  const oauthToken = {
    key: integrationOptions.accessToken,
    secret: integrationOptions.accessTokenSecret,
  };

  return (url, method) =>
    oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
}

/**
 * Initializes the Commerce client according to the given params
 *
 * @param {object} params to initialize the client
 * @returns {object} the available api calls
 */
async function getAdobeCommerceClient(params) {
  const logger = Core.Logger("adobe-commerce-client", {
    level: params.LOG_LEVEL ?? "info",
  });
  const options = {
    logger,
    ...(await resolveAuthOptions(params)),
  };

  const commerceGot = await getCommerceHttpClient(
    params.COMMERCE_BASE_URL ?? process.env.COMMERCE_BASE_URL,
    options,
  );

  const wrapper = async (callable) => {
    try {
      const message = await callable();
      return { success: true, message };
    } catch (e) {
      if (e.code === "ERR_GOT_REQUEST_ERROR") {
        logger.error("Error while calling Commerce API", e);
        return {
          success: false,
          statusCode: HTTP_INTERNAL_ERROR,
          message: `Unexpected error, check logs. Original error "${e.message}"`,
        };
      }
      return {
        success: false,
        statusCode: e.response?.statusCode || HTTP_INTERNAL_ERROR,
        message: e.message,
        body: e.responseBody,
      };
    }
  };

  return {
    // Commerce Rest API: https://developer.adobe.com/commerce/webapi/rest/quick-reference/
    get: async (requestUrl) =>
      wrapper(() =>
        commerceGot(`V1/${requestUrl}`, {
          method: "GET",
        }).json(),
      ),
    post: async (requestUrl, body) =>
      wrapper(() =>
        commerceGot(`V1/${requestUrl}`, {
          method: "POST",
          json: body,
        }).json(),
      ),
  };
}

export {
  getAdobeCommerceClient
};
