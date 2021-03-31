const models = require('../../models');
const { Op } = require("sequelize");

module.exports = {
    getTotalCustomers: async () => {

            const customers = await models.Customer.findAndCountAll({
                where: {
                    is_deleted: false,
                }
            });

            return { numberOfCustomer:customers.count };

         
    },

    getTotalRestaurants: async () => {

            const restaurants = await models.Restaurant.findAndCountAll({
                where: {
                    is_deleted: false,
                }
            });

            return {numberOfRestaurants:restaurants.count };

         
    },

    getTotalDrivers: async () => {
        

            const drivers = await models.Driver.findAndCountAll({
                where: {
                    is_deleted: false,
                }
            });

            return { numberOfDrivers:drivers.count };

         
    },

    getTotalOrders: async () => {

            const orders = await models.Order.findAndCountAll({
                where: {
                    is_deleted: false,
                    status:[1,2,3,4]
                }
            });

            return { numberOfOrders:orders.count };

         
    },

    getTotalRevenue: async () => {
                
            const totalAmount = await models.Order.sum('amount',{
                where:  {
                    is_deleted: false,
                    status: [1,2, 3, 4],
                }
            });
           
            
            return {totalRevenue:totalAmount };

         
    },

    getTotalRevenueByDate: async (params) => {

            const totalAmount = await models.Order.sum('amount',{
                where:  {
                    is_deleted: false,
                        status: [1,2, 3, 4],
                    created_at:{
                        [Op.between]: [params.start_date, params.end_date]
                    }
                }
            });
                

            
            return {totalRevenue:totalAmount };

         
    },
}