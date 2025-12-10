# Fulcrum Order Comment -- Adobe App Builder Extension

Fulcrum Order Comment is an **App Builder Extension** built using **Adobe App Builder** that works for both SaaS (Adobe Commerce as a Cloud Service) and PaaS (Adobe Commerce on Cloud).\
It adds a configuration UI inside the Commerce Admin panel for enabling/disabling the extension and displays an Order Comment column in the Order Grid using Admin UI SDK.

------------------------------------------------------------------------

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Create an App Builder Project](#create-an-app-builder-project)
- [Initialize the Project](#initialize-the-project)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Changelog](#changelog)
- [Support](#support)
- [Documentation](#documentation)

------------------------------------------------------------------------

## Overview

The extension is only responsible for displaying the Order Comment column in the Orders Grid using the Admin UI SDK, pulling the data via Adobe Commerce REST Orders API.\

**IMPORTANT**: The process of saving the comment must be done by the user, in their preferred storefront, using Magento's native APIs (GraphQL or REST API) to save the custom attribute named "**order_comment**" in the Order object. [More details below](#usage).

------------------------------------------------------------------------

## Prerequisites

- Adobe Commerce SaaS or Adobe Commerce PaaS (2.4.5+)
- Node.js v22+
- Adobe I/O CLI  
  ```bash
  npm install -g @adobe/aio-cli
  ```
- Access to Adobe Developer Console with App Builder enabled

### SaaS Installation Steps
- Create the App Builder project (below) and configure IMS OAuth Server-to-Server.
- Populate SaaS environment variables in `.env` (see [Environment Variables](#environment-variables)).
- Deploy the app; no Commerce module installation is required.

### PaaS Installation Steps
- Install the Commerce modules listed below.
- Configure Commerce Integration credentials or IMS OAuth credentials.
- If using IMS on PaaS, enable the IMS module as described in https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/connect/#adobe-identity-management-service-ims.
- Populate PaaS environment variables in `.env`.

### Required modules for PaaS only

```bash
composer require "magento/commerce-backend-sdk": ">=3.0"
composer require magento/out-of-process-custom-attributes=^0.2.0  --with-dependencies
```

------------------------------------------------------------------------

## Create an App Builder Project

1. Open Adobe Developer Console: https://console.adobe.io/
2. Create a new project and add **App Builder**.
3. Create workspaces (Stage/Production) and note the project/workspace IDs for deployment.
4. Enable required services/APIs: **I/O Management API, Adobe Commerce as a Cloud Service, Adobe Commerce with Adobe ID (OAuth Web App), Api Mesh for Adobe Developer App Builder**.

------------------------------------------------------------------------

## Initialize the Project

```bash
aio app init
npm install
aio app use -w <Workspace>
aio app build
```

------------------------------------------------------------------------

## Environment Variables

Create a `.env` file from `env.dist` and fill what you need.

### Shared
```env
COMMERCE_BASE_URL=
LOG_LEVEL=info
AIO_RUNTIME_NAMESPACE=
```

### SaaS (IMS OAuth)
```env
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRETS=
OAUTH_TECHNICAL_ACCOUNT_ID=
OAUTH_TECHNICAL_ACCOUNT_EMAIL=
OAUTH_IMS_ORG_ID=
OAUTH_SCOPES=
```

### PaaS (Commerce Integration)
```env
COMMERCE_CONSUMER_KEY=
COMMERCE_CONSUMER_SECRET=
COMMERCE_ACCESS_TOKEN=
COMMERCE_ACCESS_TOKEN_SECRET=
```

SaaS example: `COMMERCE_BASE_URL=https://na1.api.commerce.adobe.com/<tenant_id>/`  
PaaS example: `COMMERCE_BASE_URL=https://yourcommerce.com/rest/default/`

------------------------------------------------------------------------

## Usage

Once the App Builder application is deployed and your Adobe Commerce instance is ready, your front-end can use the native APIs to save an Order Comment:

### Example Front-end REST API call:
#### Cart (when the quote is converted to an order, the custom attributes are copied to the order)

```
curl -i -X PUT \
   -H "Content-Type:application/json" \
   -H "Authorization:Bearer <TOKEN>" \
   -d \
'{
  "quote": {
    "customer": {
        "id":2
    },
    "store_id":1,
    "custom_attributes":[       
        {
            "attribute_code": "order_comment",
            "value": "Example Order Comment"
        }
    ]
  }
}' \
 'https://<COMMERCE_URL>/rest/all/V1/carts/{cartId}'

```

#### Order

```
curl -i -X POST \
   -H "Content-Type:application/json" \
   -H "Authorization:Bearer <token>" \
   -d \
'{
  "entity": {
    "entity_id": 14,
    "custom_attributes":[
      {
          "attribute_code": "order_comment",
          "value": "Example Order Comment"
      }
    ]
  }
}' \
 'https://<COMMERCE_URL>/rest/all/V1/orders'

```

### Example Front-end GraphQL API call:

```
mutation {
  setCustomAttributesOnCart(
    input: {
      cart_id: "8k0Q4MpH2IGahWrTRtqM61YV2MtLPApz"
      custom_attributes: [
        { 
          attribute_code: "order_comment",
          value: "Example Order Comment"
        }
      ]
    }
  ) {
    cart {
      id
      custom_attributes {
        attribute_code
        value
      }
    }
  }
}
```

------------------------------------------------------------------------

## Changelog

- 1.0.0 - Initial release;

------------------------------------------------------------------------

## Support

**Contact:** info@fulcrumdigital.com

------------------------------------------------------------------------

## Documentation

App Builder: https://experienceleague.adobe.com/en/docs/commerce-learn/tutorials/adobe-developer-app-builder/introduction-to-app-builder \
Custom Attributes: https://developer.adobe.com/commerce/webapi/rest/modules/custom-attributes/ \
Custom Attributes GraphQL: https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-cart/ \
Admin SDK: https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/ \
PaaS vs SaaS: https://experienceleague.adobe.com/en/docs/commerce/cloud-service/feature-comparison
