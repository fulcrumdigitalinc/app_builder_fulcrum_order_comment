const { Core } = require('@adobe/aio-sdk')
const logger = Core.Logger('order-custom-grid-columns', { level: 'info' });
const { getAdobeCommerceClient } = require('../../../../lib/adobe-commerce');
const qs = require('qs');

export async function main(params) {

    const selectedIds = params.ids ? params.ids.split(',') : [];
    const commerceClient = await getAdobeCommerceClient(params);

    let queryParams;

    if (selectedIds.length === 0) {
        queryParams = qs.stringify({
            'searchCriteria': 'all',
            'fields': 'items[entity_id,increment_id,custom_attributes]'
        }, { encode: false })
    } else {
        queryParams = qs.stringify({
            'searchCriteria[filter_groups][0][filters][0][field]': 'increment_id',
            'searchCriteria[filter_groups][0][filters][0][value]': selectedIds.join(','),
            'searchCriteria[filter_groups][0][filters][0][condition_type]': 'in',
            'fields': 'items[entity_id,increment_id,custom_attributes]'
        }, { encode: false })
    }

    logger.info(`Fetching orders with IDs: ${selectedIds.join(',')}`);

    const result = await commerceClient.get(`orders?${queryParams.toString()}`);

    logger.info(`Result from Commerce: ${JSON.stringify(result)}`);

    if (!result.success) {
        return {
            statusCode: result.statusCode || 502,
            body: { success: false, error: result.message || 'Failed to fetch Order Comments' },
        };
    }

    const orderGridColumns = {
        orderGridColumns: {}
    };

    try {
        const comments = await extractOrderComments(result.message, selectedIds);

        for (const incrementId in comments) {
            if (comments.hasOwnProperty(incrementId)) {
                orderGridColumns.orderGridColumns[incrementId] = {
                    order_comment: comments[incrementId]
                };
            }
        }
    } catch (error) {
        logger.error(`There was an error during Order Comments retrieval. Error message: ${error.message}`);
        return {
            statusCode: 500,
            body: { success: false, error: `There was an error during Order Comments retrieval. Error message: ${error.message}` }
        };
    }

    if (selectedIds.length === 0) {
        return {
            statusCode: 200,
            body: orderGridColumns,
        }
    }

    const filteredColumns = {
        "orderGridColumns": {}
    }
    selectedIds.map(String).forEach(id => {
        if (orderGridColumns.orderGridColumns[id]) {
            filteredColumns.orderGridColumns[id] = orderGridColumns.orderGridColumns[id]
        }
    });
    filteredColumns.orderGridColumns['*'] = orderGridColumns.orderGridColumns['*']

    return {
        statusCode: 200,
        body: filteredColumns
    }
}

async function extractOrderComments(response, selectedIds) {
  const comments = {};
  const orders = response.items || [];

  orders.forEach(order => {
    if (!order.increment_id) {
        return;
    }
    
    if (!selectedIds.length || selectedIds.includes(order.increment_id)) {
      const orderCommentAttr = (order.custom_attributes || []).find(attr => attr.attribute_code === 'order_comment');
      comments[order.increment_id] = orderCommentAttr ? orderCommentAttr.value : '';
    }
  });

  return comments;
}