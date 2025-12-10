const { Core } = require("@adobe/aio-sdk");
const {
  readConfiguration,
  writeConfiguration,
} = require("../../../shared/configurationHelper");

/**
 * Main admin action
 *
 * @param {object} params Action input param
 * @returns {object} Response object
 */
async function main(params) {
  const logger = Core.Logger("order-comment-config", { level: "info" });
  const name = "order-comment";

  // Check the method
  if (params.__ow_method === "post") {
    const { status } = params.payload;

    if (!status) {
      logger.error("Missing field for request", params);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error:
            "Missing required fields (status).",
          receivedParams: params,
        }),
      };
    }

    const configToStore = {status};

    try {
      await writeConfiguration(configToStore, name, params);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Saved config",
          savedConfig: configToStore,
        }),
      };
    } catch (error) {
      logger.error(error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          message: "Error while saving configuration",
        }),
      };
    }
  } else if (params.__ow_method === "get") {
    try {
      const loadedConfig = await readConfiguration(params, name);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Loaded config",
          config: loadedConfig,
        }),
      };
    } catch (error) {
      logger.error(error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          message: "Error while loading configuration",
        }),
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Method Not Allowed",
        allowedMethods: ["GET", "POST"],
      }),
    };
  }
}

exports.main = main;