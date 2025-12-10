const stateLib = require("@adobe/aio-lib-state");

// Import the MAX_TTL constant
const { MAX_TTL } = stateLib;

const { readFile, writeFile } = require("./libFileRepository");

/**
 * Write the configuration to a file
 * @param {object} config Configuration to save to file
 * @param {string} name Filename suffix
 * @param {object} params App parameters
 */
async function writeConfiguration(config, name, params) {
  const { RUNTIME_NAMESPACE } = params;

  // Convert the entire form submission to a JSON string
  const configString = JSON.stringify(config);

  const state = await stateLib.init();

  await state.put(`${name}Config`, configString, {
    ttl: MAX_TTL,
  });

  // Save to .enc file using aio-lib-files
  const filePath = `${RUNTIME_NAMESPACE}-${name}.enc`;
  await writeFile(filePath, Buffer.from(JSON.stringify(configString)));
}

/**
 * Read the configuration from the file
 * @param {object} params App parameters
 * @param {string} name Filename suffix
 * @returns {object} Return the configuration
 */
async function readConfiguration(params, name) {
  const { RUNTIME_NAMESPACE } = params;
  const state = await stateLib.init();

  let config = await state.get(`${name}Config`);

  if (!config) {
    // If the state read config is null/falsey, we try to read it from the file
    const filePath = `${RUNTIME_NAMESPACE}-${name}.enc`;
    const encryptedBuffer = await readFile(filePath);

    config = encryptedBuffer;

    // State the loaded configuration on the state
    await state.put(`${name}Config`, JSON.stringify(config), {
      ttl: MAX_TTL,
    });
  }

  return JSON.parse(config.value);
}

exports.readConfiguration = readConfiguration;
exports.writeConfiguration = writeConfiguration;