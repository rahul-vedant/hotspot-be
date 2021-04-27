const { Driver, Order, DriverEarningDetail } = require('../../models');
const constants = require('../../constants');
const utilityFunction = require("../../utils/utilityFunctions")
const { Op } = require("sequelize");

class EarningServices  {

    constructor() { }

    /*
    * function for get earning list
    */
    getEarningList = async (params) => {
        let [offset, limit] = await utilityFunction.pagination(params.page, params.page_size);

        var whereCondtion = {
            status: params.type
        }

        if (params.start_date) {
            whereCondtion.created_at = {
                [Op.gte]: params.start_date
            }
        }

        if (params.end_date) {
            whereCondtion.created_at = {
                [Op.lte]: params.end_date
            }
        }
        console.log(whereCondtion);
        return await DriverEarningDetail.findAndCountAll({
            where: whereCondtion,
            include:[
                {
                    model: Order,
                    required: false,
                    attributes: ['id','status','created_at']
                }
            ],
            limit:limit,
            offset: offset
        });
    }

   
}

module.exports = { EarningServices }