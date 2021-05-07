const models = require('../../models');
const { Op } = require("sequelize");
const utility = require('../../utils/utilityFunctions');
const constants = require("../../constants");

const getOrderRow =  async (args) => {
   
        
        const orderRows = [];
        for (const val of args.orderList.rows) {

            let status = null;

            if (val.status === 1) {
                if(val.type===constants.ORDER_TYPE.pickup) status="Pickup"
                else status = "Pending"
            }
            else if ([2, 3].includes(val.status)) {
                status="Driver Allocated"
            }
            else if (val.status === 4) {
                if(val.type===constants.ORDER_TYPE.pickup) status="Completed"
                else status="Delivered"
            }

            orderRows.push({
                id: val.id,
                orderId: val.order_id,
                customerName: val.order_details.customer.name,
                hotspotLocation: val.order_details.hotspot? {
                    name: val.order_details.hotspot.name,
                    details: val.order_details.hotspot.location_detail,
                }:null,
                amount: val.amount,
                restaurant:val.order_details.restaurant.restaurant_name,
                status,
                delivery_datetime: val.delivery_datetime,
                driver: val.order_details.driver? `${val.order_details.driver.first_name} ${val.order_details.driver.last_name}`:null,
                createdAt:val.createdAt,
            })
        }

        args.orderList.rows = orderRows;
        
        return {orderList: args.orderList};


    


};


module.exports = {
    getActiveOrders: async (params) => {
    

            let [offset, limit] = await utility.pagination(params.page, params.page_size);
            params.status = parseInt(params.status_filter);
            let query = {};
            let status = null;
            if (params.status || params.status==0) {
                if (!([0, 1, 2].includes(params.status))) throw new Error(constants.MESSAGES.invalid_status);
                status = params.status;
            }
            else {
                status = [1, 2, 3];
            }

            let tomorrow = new Date(`${(new Date()).getFullYear()}-${(new Date()).getMonth() + 1}-${(new Date()).getDate() + 1}`);
            query.where = {
                delivery_datetime: {
                    [Op.lt]:tomorrow,
                },
            };
            if (params.searchKey) {
                let searchKey = params.searchKey;
                query.where = {
                    ...query.where,
                    [Op.or]: [
                        { order_id: { [Op.iLike]: `%${searchKey}%` } },
                    ]
                };
            }

            if (status) {
                if (status == 1) {
                    query.where = {
                        ...query.where,
                        status,
                        type: { [Op.not]: constants.ORDER_TYPE.pickup },
                    };
                        
                }
                else {
                    query.where = {
                        ...query.where,
                        status,
                    };
                }
                 
            }
            else {
                query.where = {
                    ...query.where,
                    type: constants.ORDER_TYPE.pickup,
                    status:1,
                };
            }


            query.order = [
                ['id', 'DESC']
            ];
            query.limit = limit;
            query.offset = offset;
            query.raw = true;

            let orderList = await models.Order.findAndCountAll(query);
            
            if (orderList.count === 0) throw new Error(constants.MESSAGES.no_order);

            return getOrderRow({orderList})
            
        
    },

    getScheduledOrders: async (params) => {
       

            let [offset, limit] = await utility.pagination(params.page, params.page_size);

            params.status = parseInt(params.status_filter);

            let query = {};
            
            let status = null;
            if (params.status || params.status==0) {
                if (!([0, 1, 2, 3].includes(params.status))) throw new Error(constants.MESSAGES.invalid_status);
                status = params.status;
            }
            else {
                status = [1, 2, 3];
            }

            let tomorrow = new Date(`${(new Date()).getFullYear()}-${(new Date()).getMonth() + 1}-${(new Date()).getDate() + 1}`);
            query.where = {
                delivery_datetime: {
                    [Op.gte]:tomorrow,
                },
            };
            if (params.searchKey) {
                let searchKey = params.searchKey;
                query.where = {
                    ...query.where,
                    [Op.or]: [
                        { order_id: { [Op.iLike]: `%${searchKey}%` } },
                    ]
                };
            }

            if (status) {
                if (status == 1) {
                    query.where = {
                        ...query.where,
                        status,
                        type: { [Op.not]: constants.ORDER_TYPE.pickup },
                    };
                        
                }
                else {
                    query.where = {
                        ...query.where,
                        status,
                    };
                }
                 
            }
            else {
                query.where = {
                    ...query.where,
                    type: constants.ORDER_TYPE.pickup,
                    status:1,
                };
            }

            query.order = [
                ['id', 'DESC']
            ];
            query.limit = limit;
            query.offset = offset;
            query.raw = true;

            let orderList = await models.Order.findAndCountAll(query);
            
            if (orderList.count === 0) throw new Error(constants.MESSAGES.no_order);

            return getOrderRow({orderList})
            
        
    },

    getCompletedOrders: async (params) => {
       

            let [offset, limit] = await utility.pagination(params.page, params.page_size);

            let query = {};

            query.where = {
                status:4,
                
            };
            if (params.searchKey) {
                let searchKey = params.searchKey;
                query.where = {
                    ...query.where,
                    [Op.or]: [
                        { order_id: { [Op.iLike]: `%${searchKey}%` } },
                    ]
                };
            }
            query.order = [
                ['id', 'DESC']
            ];
            query.limit = limit;
            query.offset = offset;
            query.raw = true;

            let orderList = await models.Order.findAndCountAll(query);
            
            if (orderList.count === 0) throw new Error(constants.MESSAGES.no_order);

            return getOrderRow({orderList})
            
        
    },

    getOrderDetails: async (params) => {
       

            const orderId = params.orderId;

            const order = await models.Order.findOne({
                where: {
                    order_id:orderId,
                }
            });

            if (!order) throw new Error(constants.MESSAGES.no_order);

            let status = null;

            if (order.status === 1) {
                if(order.type===constants.ORDER_TYPE.pickup) status="Pickup"
                else status = "Pending"
            }
            else if (order.status === 2) {
                status="Food is being prepared"
            }
            else if (order.status === 3) {
                status="Food is on the way"
            }
            else if (order.status === 4) {
                if(order.type===constants.ORDER_TYPE.pickup) status="Completed"
                else status="Delivered"
            }

            let driver = null;
            if (order.driver_id) {
              driver= await models.Driver.findByPk(order.driver_id);
            }
            
            const orderDetails = {
                orderId: orderId,
                createdAt: order.createdAt,
                deliveryDateTime: order.delivery_datetime,
                customer: order.order_details.customer.name,
                restaurant: order.order_details.restaurant.restaurant_name,
                hotspotLocation: order.order_details.hotspot? {
                    name: order.order_details.hotspot.name,
                    details: order.order_details.hotspot.location_detail,
                } : null,
                orderItems:order.order_details.ordered_items,
                amount: order.amount,
                status,
                driver: order.order_details.driver? `${order.order_details.driver.first_name} ${order.order_details.driver.last_name}`:null,
                delivery_image_urls:order.delivery_image_urls,
            }
            
            return { orderDetails };
            
        
    },

    assignDriver: async (params) => {
       

        const orderId = params.orderId;
        const driverId = params.driverId;

        const order = await utility.convertPromiseToObject(await models.Order.findOne({
                where: {
                    order_id:orderId,
                }
            })
        );

        if (!order) throw new Error(constants.MESSAGES.no_order);

        const driver = await utility.convertPromiseToObject(await models.Driver.findOne({
                attributes: ['id','first_name','last_name'],
                where: {
                    id:driverId
                }
            })
        );

    
        if (!driver) throw new Error(constants.MESSAGES.no_driver);

        const orderPickup = await models.OrderPickup.findOne({
            where: {
                hotspot_location_id: order.hotspot_location_id,
                delivery_datetime: order.delivery_datetime,
                driver_id:driver.id
                }
        })
        let order_pickup_id="PIC-" + (new Date()).toJSON().replace(/[-]|[:]|[.]|[Z]/g, '');
        if (orderPickup) {
            let currentOrderPickup = await utility.convertPromiseToObject(orderPickup);
            orderPickup.restaurant_fee += order.order_details.restaurant.fee;
            orderPickup.order_count =parseInt(currentOrderPickup.order_count)+ 1;
            orderPickup.amount += order.amount;
            orderPickup.tip_amount += order.tip_amount;
            let updatedRestaurant = [];
            let findRestaurant = currentOrderPickup.pickup_details.restaurants.find(({ id }) => id == order.order_details.restaurant.id);
            if (findRestaurant) {
                updatedRestaurant = currentOrderPickup.pickup_details.restaurants.map((rest) => {
                    if (rest.id == order.order_details.restaurant.id) {
                        rest.order_count = parseInt(rest.order_count)+1;
                        return rest;
                    }
                    else {
                        return rest;
                    }
                })
            }
            else {
                order.order_details.restaurant.order_count = 1;
                updatedRestaurant=[...currentOrderPickup.pickup_details.restaurants,order.order_details.restaurant];
            }
            orderPickup.pickup_details = {
                hotspot:currentOrderPickup.pickup_details.hotspot,
                restaurants: updatedRestaurant,
                driver:currentOrderPickup.pickup_details.driver,
            };
            orderPickup.save();            
            order_pickup_id = orderPickup.order_pickup_id;

        }
        else {
            order.order_details.restaurant.order_count = 1;
            let orderPickupObj = {
                pickup_id: order_pickup_id,
                hotspot_location_id: order.hotspot_location_id,
                restaurant_fee:order.order_details.restaurant.fee,
                order_count: 1,
                amount:order.amount,
                tip_amount:order.tip_amount,
                driver_id:driver.id,
                delivery_datetime:order.delivery_datetime,
                pickup_details: {
                    hotspot:order.order_details.hotspot,
                    restaurants:[order.order_details.restaurant],
                    driver,
                }
                
            }
            await models.OrderPickup.create(orderPickupObj)
        }
    

        const fee = await models.Fee.findOne({
            where: {
                order_range_from: {
                    [Op.lte]:order.amount,
                },
                order_range_to: {
                    [Op.gte]:order.amount,
                },
                fee_type: 'driver',             
                
            }
        })

        delete order.order_details.restaurant.order_count;

        await models.Order.update({
            status: 2,            
            order_pickup_id,
            order_details:{ ...order.order_details,driver },
            driver_id: driver.id,
            driver_fee:fee?fee.fee:null,
        },
            {
                where: {
                    order_id:orderId
                },
                returning: true,
            }
        );

        return true;

        
    }
}