const { Core } = require("@adobe/aio-sdk");
const {
  readConfiguration
} = require("../../../shared/configurationHelper");

/**
 * Extension Registration Component
 *
 * @returns {Promise<{statusCode: number, body: object}>} The HTTP response with status code and body
 */
async function main(params) {
  const logger = Core.Logger("order-comment-registration", { level: "info" });
  const extensionId = 'fulcrum_order_comment';

  const body = {
    registration: {
      menuItems: [
        {
          id: `${extensionId}::order_comment`,
          title: 'Fulcrum Order Comment',
          parent: `${extensionId}::apps`,
          sortOrder: 1,
        },
        {
          id: `${extensionId}::apps`,
          title: 'Apps',
          isSection: true,
          sortOrder: 100,
        },
      ],
      page: {
        title: 'Fulcrum Order Comments',
      }
    }
  }

  let isConfigEnabled = false;
  
  const { MESH_ID } = params;

  try {
      
      const configName = "order-comment";
      const loadedConfig = await readConfiguration(params, configName);
      isConfigEnabled = loadedConfig.status === 'on' ? true : false;
    } catch (error) {
      logger.error(error);
      isConfigEnabled = false;
    }

  if (isConfigEnabled) {
    body.registration.order = {
      gridColumns: {
        data: {
            meshId: MESH_ID
        },
        properties: [
          {
              label: 'Order Comment',
              columnId: 'order_comment',
              type: 'string',
              align: 'left'
          }
        ]
      },
    }
  }

  return {
    statusCode: 200,
    body: body
  };
}

exports.main = main;
